// Minimal X11 window introspection using xprop/xwininfo only.
// xdotool and wmctrl are not installed on this machine, so we parse the
// EWMH properties directly.
const { execFileSync } = require('child_process');

function sh(cmd, args) {
	try {
		return execFileSync(cmd, args, { encoding: 'utf8', timeout: 2000 });
	} catch (e) {
		return '';
	}
}

function clientList() {
	const out = sh('xprop', ['-root', '_NET_CLIENT_LIST']);
	return (out.match(/0x[0-9a-f]+/g) || []);
}

function windowName(id) {
	let out = sh('xprop', ['-id', id, '_NET_WM_NAME']);
	let m = out.match(/=\s*"(.*)"\s*$/m);
	if (m) return m[1];
	out = sh('xprop', ['-id', id, 'WM_NAME']);
	m = out.match(/=\s*"(.*)"\s*$/m);
	return m ? m[1] : '';
}

function windowClass(id) {
	const out = sh('xprop', ['-id', id, 'WM_CLASS']);
	const m = out.match(/=\s*(.*)$/m);
	return m ? m[1].replace(/"/g, '').trim() : '';
}

function windowGeometry(id) {
	const out = sh('xwininfo', ['-id', id]);
	if (!out) return null;
	const num = (re) => {
		const m = out.match(re);
		return m ? parseInt(m[1], 10) : null;
	};
	const x = num(/Absolute upper-left X:\s+(-?\d+)/);
	const y = num(/Absolute upper-left Y:\s+(-?\d+)/);
	const w = num(/Width:\s+(\d+)/);
	const h = num(/Height:\s+(\d+)/);
	const viewable = /Map State:\s+IsViewable/.test(out);
	if (x === null || y === null || w === null || h === null) return null;
	return { x, y, w, h, viewable };
}

function listWindows() {
	return clientList()
		.map((id) => {
			const geo = windowGeometry(id);
			if (!geo) return null;
			return { id, name: windowName(id), cls: windowClass(id), ...geo };
		})
		.filter(Boolean);
}

function activeWindowId() {
	const out = sh('xprop', ['-root', '_NET_ACTIVE_WINDOW']);
	const m = out.match(/(0x[0-9a-f]+)/);
	return m ? m[1] : null;
}

// Normalize ids: xprop prints 0x1c0001f, xwininfo may print 0x01c0001f
function sameId(a, b) {
	if (!a || !b) return false;
	return parseInt(a, 16) === parseInt(b, 16);
}

/**
 * Find the overlay target. Preference order matters: "Hearthstone Deck Tracker"
 * must not win when looking for "Hearthstone".
 */
function findTarget(patterns) {
	const windows = listWindows().filter((w) => w.viewable && w.w > 200 && w.h > 200);
	for (const pattern of patterns) {
		const hit = windows.find((w) => pattern.test(w.name));
		if (hit) return hit;
	}
	return null;
}

module.exports = { listWindows, activeWindowId, findTarget, sameId };
