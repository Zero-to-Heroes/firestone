#!/usr/bin/env bash
# Upload premium marketing assets to the static CDN S3 bucket under premium/.
#
# Images (docs/premium/highres):
#   For each foo.webp (not ending in -thumb): uploads premium/foo.webp and generates/uploads
#   premium/foo-thumb.webp — fixed WxH from the top (resize to width, crop height, ImageMagick 7).
#
# Videos (docs/premium/videos), optional:
#   Uploads each .mp4 / .webm / .mov as-is with the correct Content-Type (no transcoding).
#   Use the same basename in premium-page.content.ts: premiumCdnVideo('name.mp4').
#
# By default, skips uploading a key if an object already exists at that key (use --force to overwrite).
#
# Prerequisites: ImageMagick 7 (`magick`) when highres has WebPs; AWS CLI v2 (`aws`), credentials.
# Objects use --acl public-read (bucket must allow ACLs / static hosting as needed).
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
#   bash build-tools/upload-premium-static.sh --force
#   bash build-tools/upload-premium-static.sh --dry-run --force

set -uo pipefail

die() {
	echo "upload-premium-static: $*" >&2
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
INPUT_DIR="$REPO_ROOT/docs/premium/highres"
VIDEO_DIR="$REPO_ROOT/docs/premium/videos"
# Thumbnails are written here and kept after upload so you can inspect them locally (gitignored).
THUMB_DIR="$REPO_ROOT/docs/premium/thumbnails"

BUCKET="${PREMIUM_STATIC_S3_BUCKET:-static.firestoneapp.com}"
THUMB_W="${PREMIUM_THUMB_WIDTH:-${PREMIUM_THUMB_MAX_WIDTH:-400}}"
THUMB_H="${PREMIUM_THUMB_HEIGHT:-225}"
QUALITY="${PREMIUM_THUMB_QUALITY:-82}"

command -v aws >/dev/null 2>&1 || die "aws CLI not found in PATH"

[[ -d "$INPUT_DIR" ]] || die "Input directory missing: $INPUT_DIR"

shopt -s nullglob
mapfile -t FILES < <(find "$INPUT_DIR" -maxdepth 1 -type f -name '*.webp' | LC_ALL=C sort)
if [[ -d "$VIDEO_DIR" ]]; then
	mapfile -t VIDEOS < <(find "$VIDEO_DIR" -maxdepth 1 -type f \( -iname '*.mp4' -o -iname '*.webm' -o -iname '*.mov' \) | LC_ALL=C sort)
else
	VIDEOS=()
fi
shopt -u nullglob

[[ ${#FILES[@]} -gt 0 || ${#VIDEOS[@]} -gt 0 ]] ||
	die "Nothing to upload: add .webp under $INPUT_DIR and/or videos (.mp4, .webm, .mov) under $VIDEO_DIR"

if [[ ${#FILES[@]} -gt 0 ]]; then
	command -v magick >/dev/null 2>&1 || die "ImageMagick 7 (magick) not found in PATH (needed for WebP thumbnails)"
fi

# S3 object key, e.g. premium/foo.webp (no leading slash)
s3_object_exists() {
	local key=$1
	aws s3api head-object --bucket "$BUCKET" --key "$key" >/dev/null 2>&1
}

# $1 = local path, $2 = s3 key (under bucket), $3 = Content-Type
s3_cp_key() {
	local src=$1
	local key=$2
	local ct=$3
	local dest_uri="s3://$BUCKET/$key"
	if $DRY_RUN; then
		printf '[dry-run] aws s3 cp %q %q --content-type %q --acl public-read\n' "$src" "$dest_uri" "$ct"
	else
		aws s3 cp "$src" "$dest_uri" --content-type "$ct" --acl public-read || die "s3 cp failed: $dest_uri"
	fi
}

# Upload unless the object already exists. Pass overwrite=true (e.g. when uploading a new full image) to
# replace an existing thumb even without --force.
try_s3_cp_key() {
	local src=$1
	local key=$2
	local ct=$3
	local overwrite=${4:-false}
	if ! $FORCE && [[ "$overwrite" != true ]] && s3_object_exists "$key"; then
		echo "Skip (exists): s3://$BUCKET/$key"
		return 0
	fi
	s3_cp_key "$src" "$key" "$ct"
}

video_content_type() {
	local ext="${1##*.}"
	ext="${ext,,}"
	case "$ext" in
		mp4) echo "video/mp4" ;;
		webm) echo "video/webm" ;;
		mov) echo "video/quicktime" ;;
		*) echo "application/octet-stream" ;;
	esac
}

echo "Bucket: s3://$BUCKET/premium/"
$FORCE && echo "(--force: overwriting existing objects)"
$DRY_RUN && echo "(dry-run — no uploads or magick)"

if [[ ${#FILES[@]} -gt 0 ]]; then
	echo "WebP source: $INPUT_DIR"
	mkdir -p "$THUMB_DIR"

	for f in "${FILES[@]}"; do
		bn=$(basename "$f")
		stem="${bn%.webp}"

		if [[ "$stem" == *-thumb ]]; then
			echo "Upload only (already a thumb asset): $bn"
			try_s3_cp_key "$f" "premium/$bn" "image/webp"
			echo
			continue
		fi

		thumb_name="${stem}-thumb.webp"
		thumb_path="$THUMB_DIR/$thumb_name"
		full_key="premium/$bn"
		thumb_key="premium/$thumb_name"

		need_full=true
		need_thumb=true
		if ! $FORCE; then
			s3_object_exists "$full_key" && need_full=false
			s3_object_exists "$thumb_key" && need_thumb=false
		fi
		# New full image always needs a matching thumb on S3.
		if $need_full; then
			need_thumb=true
		fi

		if ! $need_full && ! $need_thumb; then
			echo "Skip (both exist): $bn + $thumb_name"
			echo
			continue
		fi

		if $need_full; then
			echo "Full: $bn"
			try_s3_cp_key "$f" "$full_key" "image/webp"
		fi

		# Regenerate local thumb if we must upload a new full image, or upload thumb only (full already on S3).
		if $need_full || $need_thumb; then
			echo "Thumb: $thumb_name (${THUMB_W}x${THUMB_H}, top crop, q=${QUALITY})"
			if $DRY_RUN; then
				printf '[dry-run] magick %q -resize %q -gravity North -crop %q +repage -quality %q %q\n' "$f" "${THUMB_W}x" "${THUMB_W}x${THUMB_H}+0+0" "$QUALITY" "$thumb_path"
				try_s3_cp_key "$thumb_path" "$thumb_key" "image/webp" "$need_full"
			else
				magick "$f" -resize "${THUMB_W}x" -gravity North -crop "${THUMB_W}x${THUMB_H}+0+0" +repage -quality "$QUALITY" "$thumb_path" ||
					die "magick failed for $bn"
				try_s3_cp_key "$thumb_path" "$thumb_key" "image/webp" "$need_full"
			fi
		fi
		echo
	done
fi

if [[ ${#VIDEOS[@]} -gt 0 ]]; then
	echo "Video source: $VIDEO_DIR"
	for f in "${VIDEOS[@]}"; do
		bn=$(basename "$f")
		ct=$(video_content_type "$bn")
		echo "Video: $bn → $ct"
		try_s3_cp_key "$f" "premium/$bn" "$ct"
		echo
	done
fi

echo "Done."
if ! $DRY_RUN; then
	if [[ ${#FILES[@]} -gt 0 ]]; then
		echo "Thumbnails saved under: $THUMB_DIR"
		echo "Set thumbSrc in apps/web/src/app/premium/premium-page.content.ts for each shot (see premiumCdnImage('…-thumb.webp'))."
	fi
	if [[ ${#VIDEOS[@]} -gt 0 ]]; then
		echo "Reference videos with premiumCdnVideo('filename.mp4') in premium-page.content.ts (same premium/ prefix on the CDN)."
	fi
fi
