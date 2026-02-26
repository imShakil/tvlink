#!/bin/bash

: "${PLAY_URL:?Error: PLAY_URL is not set}"
: "${REFERER:?Error: REFERER is not set}"
: "${SPOOF_IP:?Error: SPOOF_IP is not set}"
JSON_FILE="${1:-features.json}"
OUTPUT_FILE="${2:-$JSON_FILE}"

COUNT=0
FAILED=0
FAILED_CHANNELS=""

echo "Reading $JSON_FILE..."
UPDATED_JSON=$(cat "$JSON_FILE")

while IFS= read -r channel; do
  ID=$(echo "$channel" | jq -r '.id')
  NAME=$(echo "$channel" | jq -r '.name')
  SOURCE=$(echo "$channel" | jq -r '.source')

  # Skip non-token channels
  if [[ "$SOURCE" != *"103.89.248"* && "$SOURCE" != *"bdiptv"* ]]; then
    echo "SKIP: $NAME"
    continue
  fi

  # Extract stream name from first path segment after host/port.
  # Works for both valid m3u8 URLs and previously malformed embed URLs.
  STREAM=$(echo "$SOURCE" | sed -E 's|https?://[^/]+/([^/?]+).*|\1|')
  if [ -z "$STREAM" ]; then
    echo "FAIL: $NAME (no stream name)"
    ((FAILED++))
    FAILED_CHANNELS="$FAILED_CHANNELS\n- $NAME (no stream name)"
    continue
  fi

  # Fetch token
  RESPONSE=$(curl -s --max-time 15 \
    -H "Referer: $REFERER" \
    -H "X-Forwarded-For: $SPOOF_IP" \
    "$PLAY_URL?stream=$STREAM")

  # Extract embed URL, host, token.
  EMBED_URL=$(echo "$RESPONSE" | sed -n 's/.*src="\([^"]*\)".*/\1/p')
  HOST=$(echo "$EMBED_URL" | sed -E 's|^(https?)://([^/]+).*$|\1://\2|')
  TOKEN=$(echo "$EMBED_URL" | sed 's/.*token=\([^&]*\).*/\1/')

  if [ -z "$TOKEN" ] || [ -z "$HOST" ]; then
    echo "FAIL: $NAME (no token received)"
    ((FAILED++))
    FAILED_CHANNELS="$FAILED_CHANNELS\n- $NAME (no token)"
    continue
  fi

  NEW_SOURCE="$HOST/$STREAM/index.fmp4.m3u8?token=$TOKEN"

  UPDATED_JSON=$(echo "$UPDATED_JSON" | jq \
    --arg id "$ID" \
    --arg src "$NEW_SOURCE" \
    '(.channels[] | select(.id == $id) | .source) |= $src')

  # Extract expiry timestamp (3rd segment of token)
  EXPIRY=$(echo "$TOKEN" | rev | cut -d'-' -f2 | rev)
  EXPIRY_DATE=$(date -d "@$EXPIRY" '+%Y-%m-%d %H:%M UTC' 2>/dev/null || \
                date -r "$EXPIRY" '+%Y-%m-%d %H:%M UTC' 2>/dev/null)
  echo "OK: $NAME → expires $EXPIRY_DATE"
  ((COUNT++))

done < <(echo "$UPDATED_JSON" | jq -c '.channels[]')

# Save
echo "$UPDATED_JSON" | jq '.' > "$OUTPUT_FILE"

echo ""
echo "=============================="
echo "Updated : $COUNT channels"
echo "Failed  : $FAILED channels"
if [ -n "$FAILED_CHANNELS" ]; then
  echo -e "Failed list:$FAILED_CHANNELS"
fi
echo "=============================="

# Export for GitHub Actions
if [ -n "$GITHUB_ENV" ]; then
  echo "COUNT=$COUNT" >> $GITHUB_ENV
  echo "FAILED=$FAILED" >> $GITHUB_ENV
fi

# Exit with error if all failed
[ "$COUNT" -eq 0 ] && [ "$FAILED" -gt 0 ] && exit 1 || exit 0
