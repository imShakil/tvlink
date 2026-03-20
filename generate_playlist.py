#########################
### Author: @imshakil ###
#########################

import os
import argparse
import base64
import hashlib
import hmac
import time
import re
import json
from urllib.parse import urlsplit, urlunsplit
from concurrent.futures import ThreadPoolExecutor
import requests
from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv


def normalize_source(source):
    source = source.strip()
    return source


def clean_channel_url(raw_url):
    """
    Extract a usable URL from malformed lines like:
    http://...m3u8#EXTINF:-1 ...
    """
    value = raw_url.strip()
    inline_extinf_pos = value.find("#EXTINF:")
    if inline_extinf_pos > 0:
        value = value[:inline_extinf_pos].strip()
    return value


def dedupe_url_key(raw_url):
    """
    Build a stable dedupe key for stream URLs.
    - trims spaces
    - strips query string and fragment (often used for cache-busting like ?v=1)
    """
    cleaned = clean_channel_url(raw_url)
    try:
        parts = urlsplit(cleaned)
    except ValueError:
        return cleaned
    return urlunsplit((parts.scheme, parts.netloc, parts.path, "", ""))


def is_channel_stream_url(raw_url):
    """
    Keep live-stream style URLs and skip direct video-file links.
    """
    cleaned = clean_channel_url(raw_url)
    try:
        parts = urlsplit(cleaned)
    except ValueError:
        return False

    if parts.scheme not in {"http", "https"}:
        return False

    path = (parts.path or "").lower()
    blocked_video_ext = (
        ".mp4",
        ".mkv",
        ".avi",
        ".mov",
        ".wmv",
        ".flv",
        ".webm",
        ".m4v",
        ".mpg",
        ".mpeg",
        ".3gp",
    )
    return not path.endswith(blocked_video_ext)


def _clean_group_text(value):
    lowered = value.strip().lower()
    lowered = lowered.replace("&", " and ")
    lowered = lowered.replace("/", " ")
    lowered = lowered.replace("-", " ")
    lowered = re.sub(r"[^a-z0-9 ]+", " ", lowered)
    lowered = re.sub(r"\s+", " ", lowered).strip()
    return lowered


def load_group_normalization_rules(rules_file):
    if not rules_file:
        return {"exact": {}, "contains": []}

    if not os.path.exists(rules_file):
        print(f"Group normalization file not found: {rules_file} (using fallback normalization)")
        return {"exact": {}, "contains": []}

    try:
        with open(rules_file, "r", encoding="utf-8") as f:
            raw = json.load(f)
    except (OSError, json.JSONDecodeError) as err:
        print(f"Failed to load group normalization file: {rules_file} ({err})")
        return {"exact": {}, "contains": []}

    exact_map = {}
    for raw_key, raw_value in (raw.get("exact") or {}).items():
        key = _clean_group_text(str(raw_key))
        value = str(raw_value).strip()
        if key and value:
            exact_map[key] = value

    contains_rules = []
    for item in (raw.get("contains") or []):
        if not isinstance(item, dict):
            continue
        group = str(item.get("group", "")).strip()
        raw_tokens = item.get("tokens", [])
        if not group or not isinstance(raw_tokens, list):
            continue
        tokens = []
        for token in raw_tokens:
            cleaned_token = _clean_group_text(str(token))
            if cleaned_token:
                tokens.append(cleaned_token)
        if tokens:
            contains_rules.append({"tokens": tuple(tokens), "group": group})

    return {"exact": exact_map, "contains": contains_rules}


def normalize_group_name(raw_group, rules):
    cleaned = _clean_group_text(raw_group or "")
    if not cleaned:
        return "Live"

    exact_map = (rules or {}).get("exact", {})
    contains_rules = (rules or {}).get("contains", [])

    if cleaned in exact_map:
        return exact_map[cleaned]

    for rule in contains_rules:
        tokens = rule["tokens"]
        if all(token in cleaned for token in tokens):
            return rule["group"]

    return "Live"


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


def is_url_live(session, url, timeout_seconds=10, retries=3):
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; tvlink-liveness/1.0)",
        "Accept": "*/*",
    }
    not_allowed_status = {404, 500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511}
    for attempt in range(retries + 1):
        response = None
        try:
            response = session.get(
                url,
                stream=True,
                timeout=(8, timeout_seconds),
                headers=headers,
                allow_redirects=True,
            )
            if response.status_code not in not_allowed_status:
                return {
                    "is_live": True,
                    "status_code": response.status_code,
                    "reason": "ok",
                    "attempts": attempt + 1,
                    "error": "",
                }
            if attempt < retries:
                time.sleep(0.5 * (attempt + 1))
                continue
            return {
                "is_live": False,
                "status_code": response.status_code,
                "reason": "http_status",
                "attempts": attempt + 1,
                "error": "",
            }
        except requests.RequestException as err:
            if attempt < retries:
                time.sleep(0.5 * (attempt + 1))
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


def validate_candidates(candidates, max_workers, timeout_seconds, retries, log_file=""):
    if not candidates:
        return []

    def check(candidate):
        session = requests.Session()
        try:
            return is_url_live(
                session,
                candidate["url"],
                timeout_seconds=timeout_seconds,
                retries=retries,
            )
        finally:
            session.close()

    accepted = []
    logs = []
    potentially_live = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        results = executor.map(check, candidates)
        for candidate, result in zip(candidates, results):
            if result["is_live"]:
                accepted.append(candidate)
            elif result["reason"] == "request_exception":
                # Mark as potentially live, add a special group marker
                new_candidate = candidate.copy()
                new_candidate["group"] = (candidate.get("group", "") + "|potentially_live").strip("|")
                potentially_live.append(new_candidate)
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

    # Combine accepted and potentially_live channels
    return accepted + potentially_live


def load_validation_cache(cache_file):
    if not cache_file:
        return {}
    if not os.path.exists(cache_file):
        return {}
    try:
        with open(cache_file, "r", encoding="utf-8") as f:
            raw = json.load(f)
        if isinstance(raw, dict):
            return raw
    except (OSError, json.JSONDecodeError):
        pass
    return {}


def save_validation_cache(cache_file, cache):
    if not cache_file:
        return
    try:
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(cache, f, separators=(",", ":"), sort_keys=True)
    except OSError as err:
        print(f"Failed to write validation cache {cache_file}: {err}")


def _cache_is_fresh(entry, now_ts, live_ttl_seconds, dead_ttl_seconds):
    checked_at = int(entry.get("checked_at", 0))
    if checked_at <= 0:
        return False
    age = now_ts - checked_at
    if age < 0:
        return False
    is_live = bool(entry.get("is_live", False))
    ttl = live_ttl_seconds if is_live else dead_ttl_seconds
    return age <= ttl


def _candidate_from_cache(candidate, entry):
    if entry.get("is_live", False):
        return candidate
    if entry.get("reason") == "request_exception":
        new_candidate = candidate.copy()
        new_candidate["group"] = (candidate.get("group", "") + "|potentially_live").strip("|")
        return new_candidate
    return None


def validate_candidates_with_cache(
    candidates,
    max_workers,
    timeout_seconds,
    retries,
    log_file="",
    cache_file="",
    enable_cache=False,
    live_ttl_hours=24,
    dead_ttl_hours=6,
):
    if not candidates:
        return []

    if not enable_cache:
        return validate_candidates(candidates, max_workers, timeout_seconds, retries, log_file=log_file)

    cache = load_validation_cache(cache_file)
    now_ts = int(time.time())
    live_ttl_seconds = max(0, int(live_ttl_hours)) * 3600
    dead_ttl_seconds = max(0, int(dead_ttl_hours)) * 3600

    accepted_from_cache = []
    to_validate = []
    for candidate in candidates:
        key = dedupe_url_key(candidate["url"])
        entry = cache.get(key)
        if entry and _cache_is_fresh(entry, now_ts, live_ttl_seconds, dead_ttl_seconds):
            cached_candidate = _candidate_from_cache(candidate, entry)
            if cached_candidate is not None:
                accepted_from_cache.append(cached_candidate)
            continue
        to_validate.append(candidate)

    if log_file and to_validate:
        with open(log_file, "w", encoding="utf-8") as f:
            f.write("source_id\tchannel_name\turl\tresult\tstatus_code\treason\tattempts\terror\n")

    validated = []
    logs = []
    if to_validate:
        def check(candidate):
            session = requests.Session()
            try:
                return is_url_live(
                    session,
                    candidate["url"],
                    timeout_seconds=timeout_seconds,
                    retries=retries,
                )
            finally:
                session.close()

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = executor.map(check, to_validate)
            for candidate, result in zip(to_validate, results):
                key = dedupe_url_key(candidate["url"])
                cache[key] = {
                    "is_live": bool(result["is_live"]),
                    "checked_at": now_ts,
                    "reason": result.get("reason", ""),
                }

                if result["is_live"]:
                    validated.append(candidate)
                elif result["reason"] == "request_exception":
                    new_candidate = candidate.copy()
                    new_candidate["group"] = (candidate.get("group", "") + "|potentially_live").strip("|")
                    validated.append(new_candidate)

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

    save_validation_cache(cache_file, cache)
    print(
        f"Validation cache reused {len(accepted_from_cache)} channels, checked {len(to_validate)} channels."
    )
    return accepted_from_cache + validated


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
    source_cipher_key="",
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

        channel_url = clean_channel_url(line)
        channel_name = current_extinf.split(",", 1)[-1].strip() if "," in current_extinf else "Unknown"
        group = ""
        logo = ""

        if 'group-title="' in current_extinf:
            group = current_extinf.split('group-title="', 1)[1].split('"', 1)[0]
        if 'tvg-logo="' in current_extinf:
            logo = current_extinf.split('tvg-logo="', 1)[1].split('"', 1)[0]

        if is_channel_stream_url(channel_url):
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

    return candidates


def parse_existing_all_m3u(content):
    candidates = []
    lines = [line.strip() for line in content.splitlines()]
    current_extinf = None
    current_source_label = "SRC-ID:UNKNOWN"

    for line in lines:
        if not line:
            continue
        if line.startswith("# Source:"):
            current_source_label = line.replace("# Source:", "", 1).strip() or "SRC-ID:UNKNOWN"
            continue
        if line.startswith("#EXTINF:"):
            current_extinf = line
            continue
        if line.startswith("#"):
            continue
        if current_extinf is None:
            continue

        channel_url = clean_channel_url(line)
        channel_name = current_extinf.split(",", 1)[-1].strip() if "," in current_extinf else "Unknown"
        group = ""
        logo = ""

        if 'group-title="' in current_extinf:
            group = current_extinf.split('group-title="', 1)[1].split('"', 1)[0]
        if 'tvg-logo="' in current_extinf:
            logo = current_extinf.split('tvg-logo="', 1)[1].split('"', 1)[0]

        if is_channel_stream_url(channel_url):
            candidates.append(
                {
                    "logo": logo,
                    "group": group,
                    "channel_name": channel_name,
                    "url": channel_url,
                    "source": "",
                    "source_label": current_source_label,
                }
            )
        current_extinf = None

    return candidates


def combine_playlists(
    sources,
    validate_streams=True,
    source_cipher_key="",
    liveness_workers=24,
    liveness_timeout_seconds=6,
    liveness_retries=3,
    liveness_log_file="",
    prevalidation_output_file="all.m3u",
    enable_validation_cache=False,
    validation_cache_file="validation_cache.json",
    live_ttl_hours=24,
    dead_ttl_hours=6,
):
    combined = []
    seen = set()
    session = requests.Session()

    try:
        for source in sources:
            content = load_source_content(session, source)
            if content is None:
                continue

            entries = parse_m3u(
                content,
                source,
                source_cipher_key=source_cipher_key,
            )
            log_label = entries[0]["source_label"] if entries else "EMPTY"
            print(f"{log_label}: parsed {len(entries)} channels")

            for channel in entries:
                key = dedupe_url_key(channel["url"])
                if key in seen:
                    continue
                seen.add(key)
                combined.append(channel)
    finally:
        session.close()

    if prevalidation_output_file:
        write_to_file(combined, prevalidation_output_file)
        print(f"Pre-validation playlist written to {prevalidation_output_file} with {len(combined)} channels.")

    if not validate_streams:
        return combined

    validated = validate_candidates_with_cache(
        combined,
        liveness_workers,
        liveness_timeout_seconds,
        liveness_retries,
        log_file=liveness_log_file,
        cache_file=validation_cache_file,
        enable_cache=enable_validation_cache,
        live_ttl_hours=live_ttl_hours,
        dead_ttl_hours=dead_ttl_hours,
    )
    print(f"Validation accepted {len(validated)} / {len(combined)} channels.")
    return validated


def write_to_file(playlist, output_file, normalize_groups=False, group_rules=None):
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("#EXTM3U\n")
        current_source = None
        for item in playlist:
            if item["source_label"] != current_source:
                if current_source is not None:
                    f.write("\n")
                current_source = item["source_label"]
                f.write(f'# Source: {current_source}\n')
            group_name = item["group"]
            if normalize_groups:
                group_name = normalize_group_name(group_name, group_rules)
            f.write(
                f'#EXTINF:-1 tvg-logo="{item["logo"]}" group-title="{group_name}",{item["channel_name"]}\n'
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
    liveness_retries = int(os.getenv("LIVENESS_RETRIES", "3"))
    liveness_log_file = os.getenv("LIVENESS_LOG_FILE", "liveness.log").strip()
    enable_validation_cache = os.getenv("ENABLE_VALIDATION_CACHE", "true").lower() == "true"
    validation_cache_file = os.getenv("VALIDATION_CACHE_FILE", "validation_cache.json").strip()
    live_ttl_hours = int(os.getenv("LIVE_TTL_HOURS", "24"))
    dead_ttl_hours = int(os.getenv("DEAD_TTL_HOURS", "6"))
    prevalidation_output_file = os.getenv("ALL_OUTPUT_FILE", "all.m3u").strip()
    validate_from_all_file = os.getenv("VALIDATE_FROM_ALL_FILE", "").strip()
    group_normalization_file = os.getenv("GROUP_NORMALIZATION_FILE", "group_normalization.json").strip()
    group_rules = load_group_normalization_rules(group_normalization_file)

    if not source_cipher_key:
        raise SystemExit("SOURCE_PASSPHRASE is required.")

    if validate_from_all_file:
        try:
            with open(validate_from_all_file, "r", encoding="utf-8") as f:
                all_content = f.read()
        except OSError as err:
            raise SystemExit(f"Failed to read VALIDATE_FROM_ALL_FILE: {validate_from_all_file} ({err})")

        combined_playlist = parse_existing_all_m3u(all_content)
        print(
            f"Loaded {len(combined_playlist)} channels from {validate_from_all_file} for validation-only mode."
        )

        if validate_streams:
            combined_playlist = validate_candidates_with_cache(
                combined_playlist,
                liveness_workers,
                liveness_timeout_seconds,
                liveness_retries,
                log_file=liveness_log_file,
                cache_file=validation_cache_file,
                enable_cache=enable_validation_cache,
                live_ttl_hours=live_ttl_hours,
                dead_ttl_hours=dead_ttl_hours,
            )
            print(f"Validation accepted {len(combined_playlist)} channels from {validate_from_all_file}.")
    else:
        sources = parse_sources(raw_sources)
        if not sources:
            raise SystemExit("No playlist sources found in PLAYLIST_SOURCES.")
        combined_playlist = combine_playlists(
            sources,
            validate_streams=validate_streams,
            source_cipher_key=source_cipher_key,
            liveness_workers=liveness_workers,
            liveness_timeout_seconds=liveness_timeout_seconds,
            liveness_retries=liveness_retries,
            liveness_log_file=liveness_log_file,
            prevalidation_output_file=prevalidation_output_file,
            enable_validation_cache=enable_validation_cache,
            validation_cache_file=validation_cache_file,
            live_ttl_hours=live_ttl_hours,
            dead_ttl_hours=dead_ttl_hours,
        )

    write_to_file(combined_playlist, output_file, normalize_groups=True, group_rules=group_rules)

    print(f"Combined playlist written to {output_file} with {len(combined_playlist)} channels.")
