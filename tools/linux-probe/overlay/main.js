const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const path = require('path');
const x11 = require('./x11');

// Transparency on Linux/X11 needs an ARGB visual. Without this switch KWin
// hands Chromium an opaque visual and `transparent: true` silently renders black.
app.commandLine.appendSwitch('enable-transparent-visuals');

const argTarget = process.argv.find((a) => a.startsWith('--target='));
const TARGET_PATTERNS = argTarget
	? [new RegExp(argTarget.slice('--target='.length), 'i')]
	: [/^Hearthstone$/i, /^Battle\.net$/i, /^Hearthstone Deck Tracker$/i];

let overlay = null;
let clickThrough = true;
let target = null;
let lastBounds = '';

function createOverlay() {
	overlay = new BrowserWindow({
		width: 800,
		height: 600,
		x: 100,
		y: 100,
		frame: false,
		transparent: true,
		backgroundColor: '#00000000',
		hasShadow: false,
		resizable: false,
		movable: false,
		minimizable: false,
		maximizable: false,
		skipTaskbar: true,
		focusable: false, // must not steal focus from the game
		show: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	// 'screen-saver' is the highest level Electron exposes; on X11 it maps to
	// _NET_WM_STATE_ABOVE which KWin honors.
	overlay.setAlwaysOnTop(true, 'screen-saver');
	overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
	overlay.setIgnoreMouseEvents(true, { forward: true });

	overlay.loadFile(path.join(__dirname, 'overlay.html'));
	overlay.once('ready-to-show', () => overlay.show());

	return overlay;
}

function trackTarget() {
	const found = x11.findTarget(TARGET_PATTERNS);

	if (!found) {
		if (target) {
			console.log('[probe] target window disappeared');
			target = null;
			send('target', null);
		}
		return;
	}

	if (!target || target.id !== found.id) {
		console.log(`[probe] tracking "${found.name}"  id=${found.id}  class=${found.cls}`);
	}
	target = found;

	const bounds = { x: found.x, y: found.y, width: found.w, height: found.h };
	const key = JSON.stringify(bounds);
	if (key !== lastBounds) {
		lastBounds = key;
		overlay.setBounds(bounds);
		console.log(`[probe] bounds -> ${found.w}x${found.h} @ ${found.x},${found.y}`);
	}

	// Re-assert stacking. KWin can drop a window's above-state when another
	// client raises itself; this is the cheap way to find out if that happens.
	overlay.setAlwaysOnTop(true, 'screen-saver');

	const activeId = x11.activeWindowId();
	send('target', {
		name: found.name,
		cls: found.cls,
		id: found.id,
		...bounds,
		gameFocused: x11.sameId(activeId, found.id),
		clickThrough,
	});
}

function send(channel, payload) {
	if (overlay && !overlay.isDestroyed()) {
		overlay.webContents.send(channel, payload);
	}
}

function toggleClickThrough() {
	clickThrough = !clickThrough;
	overlay.setIgnoreMouseEvents(clickThrough, { forward: true });
	// A focusable window is required to actually receive clicks.
	overlay.setFocusable(!clickThrough);
	if (!clickThrough) {
		overlay.focus();
	}
	console.log(`[probe] click-through: ${clickThrough ? 'ON (input passes to game)' : 'OFF (overlay takes input)'}`);
	send('target', target ? { ...target, clickThrough } : null);
}

app.whenReady().then(() => {
	// Give the compositor a beat to settle; creating a transparent window in the
	// same tick as `ready` is a known source of black backgrounds on X11.
	setTimeout(() => {
		createOverlay();

		const ok = globalShortcut.register('Control+Shift+O', toggleClickThrough);
		console.log(`[probe] hotkey Ctrl+Shift+O registered: ${ok}`);
		globalShortcut.register('Control+Shift+Q', () => app.quit());

		console.log('[probe] displays:', screen.getAllDisplays().map((d) => `${d.size.width}x${d.size.height}@${d.bounds.x},${d.bounds.y}`).join('  '));
		console.log(`[probe] looking for: ${TARGET_PATTERNS.map(String).join(', ')}`);

		trackTarget();
		setInterval(trackTarget, 250);
	}, 500);
});

ipcMain.on('probe-click', () => {
	console.log('[probe] >>> overlay received a click - input interception works');
});

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => globalShortcut.unregisterAll());
