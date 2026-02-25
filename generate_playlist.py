#########################
### Author: @imshakil ###
#########################

import os
import argparse
import base64
import hashlib
import requests
from cryptography.fernet import Fernet, InvalidToken


def normalize_source(source):
    source = source.strip()
    return source


def encrypted_label(source, cipher_key):
    full_source_url = normalize_source(source)
    token = Fernet(cipher_key.encode("utf-8")).encrypt(full_source_url.encode("utf-8")).decode("utf-8")
    return f"SRC-ENC:{token}"


def decode_encrypted_label(label, cipher_key):
    if not label.startswith("SRC-ENC:"):
        return None
    token = label.split("SRC-ENC:", 1)[1]
    try:
        value = Fernet(cipher_key.encode("utf-8")).decrypt(token.encode("utf-8"))
        return value.decode("utf-8")
    except (InvalidToken, ValueError):
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


def is_url_live(session, url):
    try:
        response = session.get(url, stream=True, timeout=6)
        if response.status_code != 200:
            return False
        try:
            next(response.iter_content(1024))
            return True
        except StopIteration:
            return False
        finally:
            response.close()
    except requests.RequestException:
        return False


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
    session,
    validate_streams=True,
    source_cipher_key="",
):
    playlist = []
    lines = [line.strip() for line in content.splitlines()]
    current_extinf = None

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
            label = encrypted_label(source_name, source_cipher_key)
            if (not validate_streams) or is_url_live(session, channel_url):
                playlist.append(
                    {
                        "logo": logo,
                        "group": group,
                        "channel_name": channel_name,
                        "url": channel_url,
                        "source": source_name,
                        "source_label": label,
                    }
                )
        current_extinf = None

    return playlist


def combine_playlists(
    sources,
    validate_streams=True,
    source_cipher_key="",
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
                session,
                validate_streams=validate_streams,
                source_cipher_key=source_cipher_key,
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
        if line.startswith("# Source: SRC-ENC:"):
            label = line.replace("# Source: ", "", 1)
            found.append(label)

    if not found:
        print("No encrypted source labels found.")
        return

    print("Decoded source labels:")
    seen = set()
    for label in found:
        if label in seen:
            continue
        seen.add(label)
        decoded = decode_encrypted_label(label, cipher_key)
        if decoded is None:
            print(f"{label} => [decode failed]")
        else:
            print(f"{label} => {decoded}")


def resolve_cipher_key():
    passphrase = os.getenv("SOURCE_PASSPHRASE", "").strip()
    if passphrase:
        digest = hashlib.sha256(passphrase.encode("utf-8")).digest()
        return base64.urlsafe_b64encode(digest).decode("utf-8")

    return ""


if __name__ == "__main__":
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
    validate_streams = os.getenv("VALIDATE_STREAMS", "true").lower() == "true"
    output_file = os.getenv("OUTPUT_FILE", "iptv.m3u8")

    sources = parse_sources(raw_sources)
    if not sources:
        raise SystemExit("No playlist sources found in PLAYLIST_SOURCES.")
    if not source_cipher_key:
        raise SystemExit("SOURCE_PASSPHRASE is required.")

    combined_playlist = combine_playlists(
        sources,
        validate_streams=validate_streams,
        source_cipher_key=source_cipher_key,
    )
    write_to_file(combined_playlist, output_file)

    print(f"Combined playlist written to {output_file} with {len(combined_playlist)} channels.")
