# Feature screenshots

Drop a PNG screenshot here while developing a setting. Name the file after the pref field or settings node id:

- `bgsEnableDarkGiftOverlay.png`
- `battlegrounds-overlay.png`

Prefer `.png` (paste-from-screenshot). Also accepted: `.gif`, `.webp`, `.webm`, `.mp4`, `.mov`.

`release:phase1` / `release:all` upload new files to `s3://static.firestoneapp.com/features/` (skip if the key already exists; `--force` to overwrite).

The release-notes Highlights section and the NEW-badge tooltip load `{prefField}.png` from the features CDN. A missing file is hidden and does not block a version.

```bash
bash build-tools/upload-feature-static.sh
bash build-tools/upload-feature-static.sh --dry-run
bash build-tools/upload-feature-static.sh --force
```
