/**
 * Opt-in gate for Phase 0c memory attribution: cancel remote card-art / asset image
 * fetches so mid-BG Tab RSS can be compared with/without decoded bitmaps.
 *
 * FS_ELECTRON_BLOCK_REMOTE_IMAGES=1  — cancel matching requests + clear HTTP cache once
 *
 * Does not block cards JSON / API / mods downloads — only image-like paths under the
 * static hosts (cardart, .png/.jpg/.webp/.gif under hearthstone/asset, etc.).
 */
import { session } from 'electron';

const IMAGE_HOST_FILTERS = [
	'*://static.zerotoheroes.com/*',
	'*://static.firestoneapp.com/*',
	'*://*.zerotoheroes.com/hearthstone/cardart/*',
	'*://*.firestoneapp.com/*',
];

const isBlockedImageUrl = (url: string): boolean => {
	const lower = url.toLowerCase();
	if (lower.includes('/hearthstone/cardart/')) {
		return true;
	}
	if (lower.includes('/cardpacks/')) {
		return true;
	}
	// UI/asset bitmaps under the static CDN (not .json / .gz.json data)
	if (
		(lower.includes('static.zerotoheroes.com') || lower.includes('static.firestoneapp.com')) &&
		/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(lower)
	) {
		return true;
	}
	return false;
};

export const installRemoteImageGate = (): void => {
	if (process.env.FS_ELECTRON_BLOCK_REMOTE_IMAGES !== '1') {
		return;
	}

	const sess = session.defaultSession;
	sess.webRequest.onBeforeRequest({ urls: IMAGE_HOST_FILTERS }, (details, callback) => {
		if (isBlockedImageUrl(details.url)) {
			callback({ cancel: true });
			return;
		}
		callback({});
	});

	void sess.clearCache().then(
		() => console.log('[fs-mem] FS_ELECTRON_BLOCK_REMOTE_IMAGES=1 — image requests cancelled, HTTP cache cleared'),
		(e) => console.warn('[fs-mem] clearCache failed', e),
	);
};
