#!/usr/bin/env bash
# Upload feature-discovery screenshots/gifs to s3://static.firestoneapp.com/features/.
#
# Drop files in docs/features/ named after the pref field or settings node id
# (e.g. bgsEnableDarkGiftOverlay.png). Prefer PNG. See docs/features/README.md.
#
# By default, skips a key if the object already exists (use --force to overwrite).
# Empty folder is a successful no-op so release:phase1 can always call this.
#
# Prerequisites: AWS CLI v2 (`aws`), credentials.
#
# Environment:
#   FEATURE_STATIC_S3_BUCKET   Bucket name (default: static.firestoneapp.com)
#
# Usage (from repo root):
#   bash build-tools/upload-feature-static.sh
#   bash build-tools/upload-feature-static.sh --dry-run
#   bash build-tools/upload-feature-static.sh --force

set -uo pipefail

die() {
	echo "upload-feature-static: $*" >&2
	exit 1
}

DRY_RUN=false
FORCE=false
for arg in "$@"; do
	case "$arg" in
		--dry-run) DRY_RUN=true ;;
		--force) FORCE=true ;;
		*) die "Unknown option: $arg (expected --dry-run and/or --force)" ;;
	esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INPUT_DIR="$REPO_ROOT/docs/features"
BUCKET="${FEATURE_STATIC_S3_BUCKET:-static.firestoneapp.com}"

command -v aws >/dev/null 2>&1 || die "aws CLI not found in PATH"

if [[ ! -d "$INPUT_DIR" ]]; then
	echo "No docs/features directory; nothing to upload."
	exit 0
fi

shopt -s nullglob
mapfile -t FILES < <(
	find "$INPUT_DIR" -maxdepth 1 -type f \( \
		-iname '*.png' -o -iname '*.webp' -o -iname '*.gif' -o \
		-iname '*.webm' -o -iname '*.mp4' -o -iname '*.mov' \
	\) | LC_ALL=C sort
)
shopt -u nullglob

if [[ ${#FILES[@]} -eq 0 ]]; then
	echo "No feature media in $INPUT_DIR; skipping upload."
	exit 0
fi

s3_object_exists() {
	local key=$1
	aws s3api head-object --bucket "$BUCKET" --key "$key" >/dev/null 2>&1
}

content_type() {
	local ext="${1##*.}"
	ext="${ext,,}"
	case "$ext" in
		png) echo "image/png" ;;
		webp) echo "image/webp" ;;
		gif) echo "image/gif" ;;
		mp4) echo "video/mp4" ;;
		webm) echo "video/webm" ;;
		mov) echo "video/quicktime" ;;
		*) echo "application/octet-stream" ;;
	esac
}

echo "Bucket: s3://$BUCKET/features/"
$FORCE && echo "(--force: overwriting existing objects)"
$DRY_RUN && echo "(dry-run — no uploads)"

for f in "${FILES[@]}"; do
	bn=$(basename "$f")
	key="features/$bn"
	ct=$(content_type "$bn")
	if ! $FORCE && s3_object_exists "$key"; then
		echo "Skip (exists): s3://$BUCKET/$key"
		continue
	fi
	if $DRY_RUN; then
		printf '[dry-run] aws s3 cp %q %q --content-type %q --acl public-read\n' "$f" "s3://$BUCKET/$key" "$ct"
	else
		aws s3 cp "$f" "s3://$BUCKET/$key" --content-type "$ct" --acl public-read || die "s3 cp failed: $key"
	fi
done

echo "Done."
