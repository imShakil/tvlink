# Auto Update With Multiple Sources

This repo can build `iptv.m3u8` from multiple source playlists using GitHub Actions.

1. Go to your repo: `Settings -> Secrets and variables -> Actions`
2. Add one secret: `PLAYLIST_SOURCES`
3. Add one secret: `SOURCE_PASSPHRASE` (memorable plain text).
4. Put multiple playlist URLs in `PLAYLIST_SOURCES`, one URL per line (or comma-separated).
5. Run the workflow `update iptv channels` manually, or wait for the scheduled run.

The Python script validates source URLs and stream URLs, combines valid channels, removes duplicates, and writes `iptv.m3u8`.
Source names are encrypted in output (for example `SRC-ENC:gAAAAA...`) instead of showing source URLs.

Decode source labels from `iptv.m3u8` later:

```bash
SOURCE_PASSPHRASE='your-plain-text' python3 generate_playlist.py --decode-file iptv.m3u8
```

## Run Locally With `.env`

1. Copy `.env.example` to `.env`
2. Update `.env` values
3. Install dependencies:

    ```bash
    make install
    ```

4. Build playlist:

    ```bash
    make run
    ```
