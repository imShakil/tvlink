#########################
### Author: @imshakil ###
#########################

import os
import argparse
import base64
import hashlib
import hmac
import time
from concurrent.futures import ThreadPoolExecutor
import requests
from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv


def normalize_source(source):
    source = source.strip()
    return source


def encrypted_label(source, cipher_key):
    full_source_url = normalize_source(source)
    # Deterministic source ID to keep output stable across runs with same input.
    digest = hmac.new(
        cipher_key.encode("utf-8"),
        full_source_url.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"SRC-ID:{digest[:24]}"


def decode_encrypted_label(label, cipher_key):
    if not label.startswith("SRC-ENC:"):
        return None
    token = label.split("SRC-ENC:", 1)[1]
    try:
        value = Fernet(cipher_key.encode("utf-8")).decrypt(token.encode("utf-8"))
        return value.decode("utf-8")
    except (InvalidToken, ValueError):
        return None


def resolve_source_id_label(label, cipher_key, sources):
    if not label.startswith("SRC-ID:"):
        return None
    target = label.split("SRC-ID:", 1)[1].strip()
    for source in sources:
        candidate = encrypted_label(source, cipher_key)
        candidate_id = candidate.split("SRC-ID:", 1)[1]
        if hmac.compare_digest(candidate_id, target):
            return source
    return None


def parse_sources(raw_sources):
    if not raw_sources:
        return []

    sources = []
    for part in raw_sources.replace(",", "\n").splitlines():
        source = part.strip()
        if source:
            sources.append(normalize_source(source))
    return sources


def parse_legacy_dotenv_sources(dotenv_path=".env"):
    try:
        with open(dotenv_path, "r", encoding="utf-8") as f:
            raw_lines = f.readlines()
    except OSError:
        return []

    lines = []
    for line in raw_lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" in stripped:
            continue
        lines.append(stripped)

    return lines


def is_url_live(session, url, timeout_seconds=6, retries=2):
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; tvlink-liveness/1.0)",
        "Accept": "*/*",
    }
    for attempt in range(retries + 1):
        response = None
        try:
            response = session.get(
                url,
                stream=True,
                timeout=(5, timeout_seconds),
                headers=headers,
            )
            if response.status_code not in (200, 206):
                if attempt < retries:
                    time.sleep(0.4 * (attempt + 1))
                    continue
                return {
                    "is_live": False,
                    "status_code": response.status_code,
                    "reason": "http_status",
                    "attempts": attempt + 1,
                    "error": "",
                }
            try:
                next(response.iter_content(1024))
                return {
                    "is_live": True,
                    "status_code": response.status_code,
                    "reason": "ok",
                    "attempts": attempt + 1,
                    "error": "",
                }
            except StopIteration:
                return {
                    "is_live": False,
                    "status_code": response.status_code,
                    "reason": "empty_body",
                    "attempts": attempt + 1,
                    "error": "",
                }
        except requests.RequestException as err:
            if attempt < retries:
                time.sleep(0.4 * (attempt + 1))
                continue
            return {
                "is_live": False,
                "status_code": None,
                "reason": "request_exception",
                "attempts": attempt + 1,
                "error": err.__class__.__name__,
            }
        finally:
            if response is not None:
                response.close()

    return {
        "is_live": False,
        "status_code": None,
        "reason": "unknown",
        "attempts": retries + 1,
        "error": "unknown",
    }


def validate_candidates(candidates, max_workers, timeout_seconds, log_file=""):
    if not candidates:
        return []

    def check(candidate):
        session = requests.Session()
        try:
            return is_url_live(session, candidate["url"], timeout_seconds=timeout_seconds)
        finally:
            session.close()

    accepted = []
    logs = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = executor.map(check, candidates)
        for candidate, result in zip(candidates, results):
            if result["is_live"]:
                accepted.append(candidate)
            if log_file:
                status_code = result["status_code"] if result["status_code"] is not None else "-"
                logs.append(
                    (
                        f'{candidate["source_label"]}\t{candidate["channel_name"]}\t{candidate["url"]}\t'
                        f'{"LIVE" if result["is_live"] else "DEAD"}\t{status_code}\t{result["reason"]}\t'
                        f'{result["attempts"]}\t{result["error"]}\n'
                    )
                )

    if log_file and logs:
        with open(log_file, "a", encoding="utf-8") as f:
            f.writelines(logs)

    return accepted


def load_source_content(session, source):
    if source.startswith("http://") or source.startswith("https://"):
        try:
            response = session.get(source, timeout=10)
            response.raise_for_status()
            return response.text
        except requests.RequestException as err:
            print(f"Skipping source (unreachable): {source} ({err})")
            return None

    try:
        with open(source, "r", encoding="utf-8") as f:
            return f.read()
    except OSError as err:
        print(f"Skipping source (read failed): {source} ({err})")
        return None


def parse_m3u(
    content,
    source_name,
    validate_streams=True,
    source_cipher_key="",
    liveness_workers=24,
    liveness_timeout_seconds=6,
    liveness_log_file="",
):
    candidates = []
    lines = [line.strip() for line in content.splitlines()]
    current_extinf = None
    source_label = encrypted_label(source_name, source_cipher_key)

    for line in lines:
        if not line:
            continue
        if line.startswith("#EXTINF:"):
            current_extinf = line
            continue
        if line.startswith("#"):
            continue
        if current_extinf is None:
            continue

        channel_url = line
        channel_name = current_extinf.split(",", 1)[-1].strip() if "," in current_extinf else "Unknown"
        group = ""
        logo = ""

        if 'group-title="' in current_extinf:
            group = current_extinf.split('group-title="', 1)[1].split('"', 1)[0]
        if 'tvg-logo="' in current_extinf:
            logo = current_extinf.split('tvg-logo="', 1)[1].split('"', 1)[0]

        if channel_url.startswith("http"):
            candidates.append(
                {
                    "logo": logo,
                    "group": group,
                    "channel_name": channel_name,
                    "url": channel_url,
                    "source": source_name,
                    "source_label": source_label,
                }
            )
        current_extinf = None

    if not validate_streams:
        return candidates

    return validate_candidates(
        candidates,
        liveness_workers,
        liveness_timeout_seconds,
        log_file=liveness_log_file,
    )


def combine_playlists(
    sources,
    validate_streams=True,
    source_cipher_key="",
    liveness_workers=24,
    liveness_timeout_seconds=6,
    liveness_log_file="",
):
    combined = []
    seen = set()
    session = requests.Session()

    try:
        if liveness_log_file:
            with open(liveness_log_file, "w", encoding="utf-8") as f:
                f.write("source_id\tchannel_name\turl\tresult\tstatus_code\treason\tattempts\terror\n")

        for source in sources:
            content = load_source_content(session, source)
            if content is None:
                continue

            entries = parse_m3u(
                content,
                source,
                validate_streams=validate_streams,
                source_cipher_key=source_cipher_key,
                liveness_workers=liveness_workers,
                liveness_timeout_seconds=liveness_timeout_seconds,
                liveness_log_file=liveness_log_file,
            )
            log_label = entries[0]["source_label"] if entries else "EMPTY"
            print(f"{log_label}: accepted {len(entries)} channels")

            for channel in entries:
                key = channel["url"].strip()
                if key in seen:
                    continue
                seen.add(key)
                combined.append(channel)
    finally:
        session.close()

    return combined


def write_to_file(playlist, output_file):
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("#EXTM3U\n")
        current_source = None
        for item in playlist:
            if item["source_label"] != current_source:
                if current_source is not None:
                    f.write("\n")
                current_source = item["source_label"]
                f.write(f'# Source: {current_source}\n')
            f.write(
                f'#EXTINF:-1 tvg-logo="{item["logo"]}" group-title="{item["group"]}",{item["channel_name"]}\n'
            )
            f.write(f'{item["url"]}\n')


def decode_labels_from_file(input_file, cipher_key):
    with open(input_file, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f.readlines()]

    found = []
    for line in lines:
        if line.startswith("# Source: SRC-"):
            label = line.replace("# Source: ", "", 1)
            found.append(label)

    if not found:
        print("No encrypted source labels found.")
        return

    print("Decoded source labels:")
    raw_sources = os.getenv("PLAYLIST_SOURCES", "")
    if not raw_sources:
        raw_sources = "\n".join(parse_legacy_dotenv_sources(".env"))
    known_sources = parse_sources(raw_sources)

    seen = set()
    for label in found:
        if label in seen:
            continue
        seen.add(label)
        decoded = decode_encrypted_label(label, cipher_key)
        if decoded is not None:
            print(f"{label} => {decoded}")
            continue

        resolved = resolve_source_id_label(label, cipher_key, known_sources)
        if resolved is not None:
            print(f"{label} => {resolved}")
            continue

        print(f"{label} => [unresolved]")


def resolve_cipher_key():
    passphrase = os.getenv("SOURCE_PASSPHRASE", "").strip()
    if passphrase:
        digest = hashlib.sha256(passphrase.encode("utf-8")).digest()
        return base64.urlsafe_b64encode(digest).decode("utf-8")

    return ""


if __name__ == "__main__":
    load_dotenv()

    parser = argparse.ArgumentParser()
    parser.add_argument("--decode-file", help="Decode encrypted source labels from this playlist file.")
    args = parser.parse_args()

    source_cipher_key = resolve_cipher_key()
    if args.decode_file:
        if not source_cipher_key:
            raise SystemExit("SOURCE_PASSPHRASE is required for decode mode.")
        decode_labels_from_file(args.decode_file, source_cipher_key)
        raise SystemExit(0)

    raw_sources = os.getenv("PLAYLIST_SOURCES", "")
    if not raw_sources:
        raw_sources = "\n".join(parse_legacy_dotenv_sources(".env"))
    validate_streams = os.getenv("VALIDATE_STREAMS", "true").lower() == "true"
    output_file = os.getenv("OUTPUT_FILE", "iptv.m3u8")
    liveness_workers = int(os.getenv("LIVENESS_WORKERS", "24"))
    liveness_timeout_seconds = int(os.getenv("LIVENESS_TIMEOUT_SECONDS", "6"))
    liveness_log_file = os.getenv("LIVENESS_LOG_FILE", "liveness.log").strip()

    sources = parse_sources(raw_sources)
    if not sources:
        raise SystemExit("No playlist sources found in PLAYLIST_SOURCES.")
    if not source_cipher_key:
        raise SystemExit("SOURCE_PASSPHRASE is required.")

    combined_playlist = combine_playlists(
        sources,
        validate_streams=validate_streams,
        source_cipher_key=source_cipher_key,
        liveness_workers=liveness_workers,
        liveness_timeout_seconds=liveness_timeout_seconds,
        liveness_log_file=liveness_log_file,
    )
    write_to_file(combined_playlist, output_file)

    print(f"Combined playlist written to {output_file} with {len(combined_playlist)} channels.")
