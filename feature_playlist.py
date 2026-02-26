#!/usr/bin/env python3
import argparse
import json
import re
import sys
from pathlib import Path


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "custom-channel"


def parse_delete_ids(raw: str) -> list[str]:
    return [item.strip() for item in (raw or "").split(",") if item.strip()]


def validate_args(args: argparse.Namespace) -> None:
    if args.action == "add":
        required = {
            "channel-name": args.channel_name,
            "channel-logo": args.channel_logo,
            "channel-type": args.channel_type,
            "channel-source": args.channel_source,
        }
        missing = [k for k, v in required.items() if not (v or "").strip()]
        if missing:
            raise ValueError(f'Missing required add args: {", ".join(missing)}')
        return

    delete_ids = parse_delete_ids(args.delete_channel_ids)
    if not delete_ids:
        raise ValueError("For delete, provide --delete-channel-ids with comma-separated channel IDs.")


def load_features(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"{path} not found.")
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    channels = data.get("channels")
    if not isinstance(channels, list):
        raise ValueError('Invalid features.json: missing "channels" array.')
    return data


def run(args: argparse.Namespace) -> None:
    validate_args(args)
    if args.validate_only:
        print("Input validation passed.")
        return

    features_path = Path(args.features_file)
    data = load_features(features_path)
    channels = data["channels"]

    if args.action == "add":
        name = args.channel_name.strip()
        logo = args.channel_logo.strip()
        ctype = args.channel_type.strip()
        source = args.channel_source.strip()

        base_id = slugify(name)
        existing_ids = {c.get("id") for c in channels if isinstance(c, dict)}
        channel_id = base_id
        i = 2
        while channel_id in existing_ids:
            channel_id = f"{base_id}-{i}"
            i += 1

        channels.append(
            {
                "id": channel_id,
                "name": name,
                "logo": logo,
                "type": ctype,
                "source": source,
                "category": "Custom",
                "language": "en",
            }
        )
        print(f'Added channel "{name}" with id "{channel_id}".')

    else:
        delete_ids = set(parse_delete_ids(args.delete_channel_ids))
        before = len(channels)
        channels[:] = [c for c in channels if c.get("id") not in delete_ids]
        removed = before - len(channels)
        print(f"Requested delete IDs: {', '.join(sorted(delete_ids))}")
        print(f"Removed channels: {removed}")

    with features_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
        f.write("\n")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Manage channels in features.json (add/delete)."
    )
    parser.add_argument("--action", required=True, choices=["add", "delete"])
    parser.add_argument("--features-file", default="features.json")
    parser.add_argument("--channel-name", default="")
    parser.add_argument("--channel-logo", default="")
    parser.add_argument("--channel-type", default="")
    parser.add_argument("--channel-source", default="")
    parser.add_argument("--delete-channel-ids", default="")
    parser.add_argument("--validate-only", action="store_true")
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        run(args)
        return 0
    except (ValueError, FileNotFoundError, json.JSONDecodeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
