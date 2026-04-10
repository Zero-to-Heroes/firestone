#!/usr/bin/env bash
# Upload premium marketing WebPs from docs/premium/highres to the static CDN S3 bucket.
#
# For each foo.webp (not ending in -thumb): uploads premium/foo.webp and generates/uploads
# premium/foo-thumb.webp — fixed WxH from the top (resize to width, crop height, ImageMagick 7).
#
# Prerequisites: `magick` (ImageMagick 7), AWS CLI v2 (`aws`), configured credentials.
# Objects are uploaded with --acl public-read (bucket must allow ACLs / static hosting as needed).
#
# Environment:
#   PREMIUM_STATIC_S3_BUCKET   Bucket name (default: static.firestoneapp.com)
#   PREMIUM_THUMB_WIDTH        Thumbnail width in px (default: 400)
#   PREMIUM_THUMB_HEIGHT       Thumbnail height in px after top crop (default: 225, 16:9 at 400w)
#   PREMIUM_THUMB_MAX_WIDTH    Alias for PREMIUM_THUMB_WIDTH (backward compat)
#   PREMIUM_THUMB_QUALITY      WebP quality 0-100 (default: 82)
#
# Usage (from repo root):
#   bash build-tools/upload-premium-static.sh
#   bash build-tools/upload-premium-static.sh --dry-run

set -uo pipefail

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
	DRY_RUN=true
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INPUT_DIR="$REPO_ROOT/docs/premium/highres"
# Thumbnails are written here and kept after upload so you can inspect them locally (gitignored).
THUMB_DIR="$REPO_ROOT/docs/premium/thumbnails"

BUCKET="${PREMIUM_STATIC_S3_BUCKET:-static.firestoneapp.com}"
THUMB_W="${PREMIUM_THUMB_WIDTH:-${PREMIUM_THUMB_MAX_WIDTH:-400}}"
THUMB_H="${PREMIUM_THUMB_HEIGHT:-225}"
QUALITY="${PREMIUM_THUMB_QUALITY:-82}"

die() {
	echo "upload-premium-static: $*" >&2
	exit 1
}

command -v magick >/dev/null 2>&1 || die "ImageMagick 7 (magick) not found in PATH"
command -v aws >/dev/null 2>&1 || die "aws CLI not found in PATH"

[[ -d "$INPUT_DIR" ]] || die "Input directory missing: $INPUT_DIR"

s3_cp() {
	local src=$1
	local dest_uri=$2
	if $DRY_RUN; then
		printf '[dry-run] aws s3 cp %q %q --content-type image/webp --acl public-read\n' "$src" "$dest_uri"
	else
		aws s3 cp "$src" "$dest_uri" --content-type image/webp --acl public-read || die "s3 cp failed: $dest_uri"
	fi
}

mkdir -p "$THUMB_DIR"

shopt -s nullglob
mapfile -t FILES < <(find "$INPUT_DIR" -maxdepth 1 -type f -name '*.webp' | LC_ALL=C sort)
shopt -u nullglob

[[ ${#FILES[@]} -gt 0 ]] || die "No .webp files in $INPUT_DIR"

echo "Bucket: s3://$BUCKET/premium/"
echo "Source: $INPUT_DIR"
$DRY_RUN && echo "(dry-run — no uploads or magick)"

for f in "${FILES[@]}"; do
	bn=$(basename "$f")
	stem="${bn%.webp}"

	if [[ "$stem" == *-thumb ]]; then
		echo "Upload only (already a thumb asset): $bn"
		s3_cp "$f" "s3://$BUCKET/premium/$bn"
		continue
	fi

	thumb_name="${stem}-thumb.webp"
	thumb_path="$THUMB_DIR/$thumb_name"

	echo "Full: $bn"
	s3_cp "$f" "s3://$BUCKET/premium/$bn"

	echo "Thumb: $thumb_name (${THUMB_W}x${THUMB_H}, top crop, q=${QUALITY})"
	if $DRY_RUN; then
		printf '[dry-run] magick %q -resize %q -gravity North -crop %q +repage -quality %q %q\n' "$f" "${THUMB_W}x" "${THUMB_W}x${THUMB_H}+0+0" "$QUALITY" "$thumb_path"
		printf '[dry-run] aws s3 cp %q s3://%s/premium/%q --content-type image/webp --acl public-read\n' "$thumb_path" "$BUCKET" "$thumb_name"
	else
		# Same visual size on /premium: fixed width, fixed height, anchor top (crop overflow below).
		magick "$f" -resize "${THUMB_W}x" -gravity North -crop "${THUMB_W}x${THUMB_H}+0+0" +repage -quality "$QUALITY" "$thumb_path" ||
			die "magick failed for $bn"
		s3_cp "$thumb_path" "s3://$BUCKET/premium/$thumb_name"
	fi
	echo
done

echo "Done."
if ! $DRY_RUN; then
	echo "Thumbnails saved under: $THUMB_DIR"
	echo "Set thumbSrc in apps/web/src/app/premium/premium-page.content.ts for each shot (see premiumCdnImage('…-thumb.webp'))."
fi
