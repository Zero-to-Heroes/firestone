import { ElectronGameWindowService } from '@firestone/electron/common';
import { ChildProcess, spawn } from 'child_process';
import { BrowserWindow, screen } from 'electron';
import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { join } from 'path';
import { rendererUrl } from '../constants';
import { LinuxGameDetectionService, LinuxGameWindow } from './linux-game-detection.service';

/**
 * Linux replacement for the ow-electron OverlayService.
 *
 * ow-electron's overlay injects into the game and renders into its D3D swapchain, which does not
 * work under Wine. Instead this uses an ordinary transparent, always-on-top, click-through
 * BrowserWindow positioned over the Hearthstone X11 window. Verified on KDE/KWin X11
 * (see tools/linux-probe/overlay).
 *
 * Constraints inherited from that approach:
 *  - the game must run borderless-windowed, not exclusive fullscreen;
 *  - X11 only (Wayland has no protocol to position a window globally);
 *  - input interception is approximated with setIgnoreMouseEvents rather than truly stealing input.
 *
 * Exposes the subset of the OverlayService API the rest of the app touches, so callers do not
 * need to know which implementation is in use. `overlayApi` is always null here: there is no
 * Overwolf overlay package on Linux, and callers already null-check it.
 */
/** Set FIRESTONE_DEBUG_OVERLAY_INPUT=1 to trace cursor polling, hit-tests and passthrough flips. */
const DEBUG_OVERLAY_INPUT = process.env.FIRESTONE_DEBUG_OVERLAY_INPUT === '1';

export class LinuxOverlayService extends EventEmitter {
	private static instance: LinuxOverlayService;

	private overlayWindow: BrowserWindow | null = null;
	private detection: LinuxGameDetectionService;
	private gameWindowService: ElectronGameWindowService;
	private lastBounds = '';
	private hitTestTimer: NodeJS.Timeout | null = null;
	private passthrough = true;
	private lastHit = '';
	private hitTestErrorLogged = false;
	private lastHeartbeat = 0;
	private pointerProc: ChildProcess | null = null;
	private pointerPos: { x: number; y: number } | null = null;
	private buttonDown = false;

	public get overlayApi(): any {
		// No Overwolf overlay package on Linux; callers null-check this.
		return null;
	}

	private constructor() {
		super();
		this.gameWindowService = ElectronGameWindowService.getInstance();
		this.detection = LinuxGameDetectionService.getInstance(this.gameWindowService);
	}

	public static getInstance(): LinuxOverlayService {
		if (!LinuxOverlayService.instance) {
			LinuxOverlayService.instance = new LinuxOverlayService();
		}
		return LinuxOverlayService.instance;
	}

	public async registerToHearthstone(): Promise<void> {
		this.detection.on('game-launched', async (info, win: LinuxGameWindow) => {
			console.log('🎮 [linux-overlay] Hearthstone launched, creating overlay');
			await this.createOverlayWindow(win);
		});

		this.detection.on('game-window-changed', (info, win: LinuxGameWindow) => {
			this.trackGameWindow(win);
		});

		this.detection.on('game-focus-changed', (focused: boolean, info, win: LinuxGameWindow) => {
			// Keep the overlay mapped whenever the game is running and re-assert stacking. Hiding
			// on every focus loss is too aggressive: focusing the overlay itself, the tray, or a
			// Firestone window would make it vanish mid-interaction. Overlay content is only drawn
			// during a match, so at the menu it is simply transparent.
			if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
				return;
			}
			this.overlayWindow.showInactive();
			this.trackGameWindow(win);
		});

		this.detection.on('game-exit', () => {
			console.log('👋 [linux-overlay] Hearthstone exited, destroying overlay');
			this.destroyOverlay();
		});

		this.detection.start();
		console.log('[linux-overlay] registered to Hearthstone (polling /proc + X11)');
		this.emit('ready');
	}

	private async createOverlayWindow(win: LinuxGameWindow): Promise<void> {
		if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
			this.trackGameWindow(win);
			return;
		}

		const preloadPath = join(__dirname, 'main.preload.js');
		this.overlayWindow = new BrowserWindow({
			x: win.x,
			y: win.y,
			width: win.width,
			height: win.height,
			frame: false,
			transparent: true,
			backgroundColor: '#00000000',
			hasShadow: false,
			resizable: false,
			movable: false,
			skipTaskbar: true,
			// Must not steal focus from the game.
			focusable: false,
			show: false,
			webPreferences: {
				devTools: true,
				nodeIntegration: true,
				contextIsolation: false,
				preload: preloadPath,
			},
		});

		// 'screen-saver' is the highest level Electron exposes; on X11 it maps to
		// _NET_WM_STATE_ABOVE, which KWin honours.
		this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
		this.overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
		this.overlayWindow.setIgnoreMouseEvents(true, { forward: true });
		this.overlayWindow.setMenu(null);
		this.overlayWindow.once('closed', () => (this.overlayWindow = null));

		const url = rendererUrl('/overlay');
		console.log('[linux-overlay] loading overlay', url);

		this.overlayWindow.webContents.once('dom-ready', () => {
			// showInactive so the game keeps focus.
			this.overlayWindow?.showInactive();
			this.overlayWindow?.setAlwaysOnTop(true, 'screen-saver');
			this.startHitTesting();
		});

		try {
			await this.overlayWindow.loadURL(url);
		} catch (err) {
			console.error('[linux-overlay] failed to load overlay frontend:', err);
			console.error('[linux-overlay] tried to load', url);
		}
	}

	private trackGameWindow(win: LinuxGameWindow): void {
		if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
			return;
		}
		const key = `${win.width}x${win.height}@${win.x},${win.y}`;
		if (key !== this.lastBounds) {
			this.lastBounds = key;
			this.overlayWindow.setBounds({ x: win.x, y: win.y, width: win.width, height: win.height });
			console.log('[linux-overlay] bounds ->', key);
		}
		// KWin can drop the above-state when another client raises itself.
		this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
	}

	/**
	 * Makes the overlay's widgets hoverable/clickable while everything else still reaches the game.
	 *
	 * On Windows and macOS `setIgnoreMouseEvents(true, { forward: true })` still delivers move
	 * events to the renderer, so widgets get :hover for free. On Linux it does not: passthrough is
	 * implemented with an empty X11 input shape, so the window receives no pointer events at all
	 * and every widget stays inert. Instead the cursor is polled from the main process and the DOM
	 * is hit-tested at that point; passthrough is dropped only while the cursor is actually over a
	 * widget, so the game keeps the mouse the rest of the time.
	 */
	/**
	 * Streams the pointer position from the X server.
	 *
	 * `screen.getCursorScreenPoint()` reports the last position *this application* saw in an event.
	 * A click-through window receives no pointer events at all, so after the first time passthrough
	 * is dropped and restored the value freezes at wherever the cursor was when the input shape
	 * closed, and the overlay can never notice the cursor coming back. XQueryPointer asks the
	 * server directly. Falls back to the Electron value if the tracker cannot start.
	 */
	private startPointerTracker(): void {
		if (this.pointerProc) {
			return;
		}
		const script = join(__dirname, 'assets', 'linux-pointer-tracker.py');
		if (!existsSync(script)) {
			console.warn('[linux-overlay] pointer tracker missing, falling back to Electron cursor', script);
			return;
		}
		try {
			this.pointerProc = spawn('python3', [script], { stdio: ['ignore', 'pipe', 'pipe'] });
		} catch (e) {
			console.warn('[linux-overlay] could not spawn pointer tracker', e);
			return;
		}
		let buffer = '';
		this.pointerProc.stdout?.on('data', (chunk: Buffer) => {
			buffer += chunk.toString();
			const lines = buffer.split('\n');
			// Keep the trailing partial line for the next chunk.
			buffer = lines.pop() ?? '';
			const last = lines[lines.length - 1];
			if (!last) {
				return;
			}
			const [x, y, buttons] = last.split(' ').map((v) => parseInt(v, 10));
			if (Number.isFinite(x) && Number.isFinite(y)) {
				this.pointerPos = { x, y };
				this.buttonDown = buttons === 1;
			}
		});
		this.pointerProc.stderr?.on('data', (chunk: Buffer) =>
			console.warn('[linux-overlay] pointer tracker:', chunk.toString().trim()),
		);
		this.pointerProc.on('exit', (code) => {
			console.warn('[linux-overlay] pointer tracker exited', code, '- falling back to Electron cursor');
			this.pointerProc = null;
			this.pointerPos = null;
		});
		console.log('[linux-overlay] pointer tracker started');
	}

	private cursorPoint(): { x: number; y: number } {
		return this.pointerPos ?? screen.getCursorScreenPoint();
	}

	private startHitTesting(): void {
		if (this.hitTestTimer) {
			return;
		}
		this.startPointerTracker();
		this.hitTestTimer = setInterval(async () => {
			const win = this.overlayWindow;
			if (!win || win.isDestroyed()) {
				return;
			}
			try {
				const cursor = this.cursorPoint();
				const bounds = win.getBounds();
				const dx = cursor.x - bounds.x;
				const dy = cursor.y - bounds.y;
				const inside = dx >= 0 && dy >= 0 && dx < bounds.width && dy < bounds.height;
				// Per-tick state, behind an opt-in flag: at 20Hz this is far too noisy for the normal
				// log, but it is what makes a stuck cursor or a mis-sized overlay obvious.
				if (DEBUG_OVERLAY_INPUT) {
					const now = Date.now();
					if (now - this.lastHeartbeat > 1000) {
						this.lastHeartbeat = now;
						console.log(
							`[linux-overlay] poll cursor=${cursor.x},${cursor.y} bounds=${bounds.width}x${bounds.height}@${bounds.x},${bounds.y} inside=${inside} visible=${win.isVisible()} passthrough=${this.passthrough}`,
						);
					}
				}
				if (!inside) {
					this.setPassthrough(true);
					return;
				}
				// elementFromPoint works in CSS pixels, which the app's scaling service zooms
				// (~131%). Window coordinates are DIP, so undo the zoom before hit-testing.
				const zoom = win.webContents.getZoomFactor() || 1;
				const x = Math.round(dx / zoom);
				const y = Math.round(dy / zoom);

				// While click-through, X11 delivers nothing to this window, so the pointer position is
				// fed in by hand: that is what lets a widget light up under the cursor in the first
				// place. Once passthrough is off the real events arrive on their own, and injecting
				// as well would fight them — a synthetic move still in flight can land at the old
				// position and read as a mouseleave, closing the popup the user just opened.
				if (this.passthrough) {
					win.webContents.sendInputEvent({ type: 'mouseMove', x, y });
				}
				const hit = await win.webContents.executeJavaScript(
					`(() => {
						const el = document.elementFromPoint(${x}, ${y});
						if (!el) return { over: false, tag: 'none' };
						const path = [];
						for (let e = el; e && path.length < 4; e = e.parentElement) {
							path.push(e.tagName + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).join('.') : ''));
						}
						// The layout containers span the whole screen and must stay click-through;
						// anything deeper is real widget content.
						const passthroughTags = ['HTML', 'BODY', 'ELECTRON-OVERLAY', 'APP-ROOT', 'FULL-SCREEN-OVERLAYS'];
						const passthroughClasses = ['game-area', 'game-area-container', 'electron-overlay-container', 'electron-overlay-app'];
						let over = !passthroughTags.includes(el.tagName)
							&& el.id !== 'container'
							&& !passthroughClasses.some((c) => el.classList.contains(c));

						// Several widgets reserve space with large transparent boxes that still carry
						// pointer-events:all -- bgs-board-widget-wrapper lays a 1581x240 strip across
						// the middle of the screen, right over the tavern minions. Claiming the mouse
						// there makes the game unplayable, so the cursor is only taken over something
						// that is actually drawn: a background, an image, or text. A transparent
						// spacer is left click-through no matter how it is nested.
						const paints = (e) => {
							const s = getComputedStyle(e);
							if (s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
							if (s.backgroundImage && s.backgroundImage !== 'none') return true;
							const bg = s.backgroundColor;
							if (bg && bg !== 'transparent' && !/rgba\\(\\s*\\d+,\\s*\\d+,\\s*\\d+,\\s*0\\s*\\)/.test(bg)) return true;
							if (['IMG', 'SVG', 'CANVAS', 'VIDEO', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT'].includes(e.tagName)) return true;
							for (const n of e.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
							return false;
						};
						if (over) {
							const r = el.getBoundingClientRect();
							const viewport = window.innerWidth * window.innerHeight;
							if (!r.width || !r.height || (r.width * r.height) / viewport > 0.33) {
								over = false;
							} else {
								// A transparent hit-area sitting directly on painted widget content is
								// still interactive, so look a couple of levels up before giving up.
								let painted = false;
								let node = el;
								for (let i = 0; node && i < 3; i++, node = node.parentElement) {
									if (paints(node)) { painted = true; break; }
								}
								over = painted;
							}
						}
						return { over: over, tag: path.join(' < ') };
					})()`,
					false,
				);
				if (DEBUG_OVERLAY_INPUT && hit?.tag !== this.lastHit) {
					this.lastHit = hit?.tag;
					console.log('[linux-overlay] hit-test', x, y, hit?.over, hit?.tag);
				}
				// A held button keeps an existing grab alive so a drag that wanders off the widget is
				// not cut short. It must never *start* one: that is how a stuck button state would
				// make the whole game unclickable.
				const keepForDrag = this.buttonDown && !this.passthrough;
				this.setPassthrough(!hit?.over && !keepForDrag);
			} catch (e) {
				// Window torn down mid-poll, or the page is still loading.
				if (!this.hitTestErrorLogged) {
					this.hitTestErrorLogged = true;
					console.error('[linux-overlay] hit-test failed', e);
				}
			}
		}, 50);
	}

	private stopHitTesting(): void {
		if (this.hitTestTimer) {
			clearInterval(this.hitTestTimer);
			this.hitTestTimer = null;
		}
		this.pointerProc?.kill();
		this.pointerProc = null;
		this.pointerPos = null;
		this.passthrough = true;
	}

	private setPassthrough(passthrough: boolean): void {
		if (passthrough === this.passthrough || !this.overlayWindow || this.overlayWindow.isDestroyed()) {
			return;
		}
		this.passthrough = passthrough;
		this.overlayWindow.setIgnoreMouseEvents(passthrough, { forward: true });
		if (DEBUG_OVERLAY_INPUT) {
			console.log('[linux-overlay] passthrough ->', passthrough);
		}
	}

	/** Toggle whether the overlay swallows clicks (true) or passes them to the game (false). */
	public setInteractive(interactive: boolean): void {
		if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
			return;
		}
		this.overlayWindow.setIgnoreMouseEvents(!interactive, { forward: true });
		this.overlayWindow.setFocusable(interactive);
		if (interactive) {
			this.overlayWindow.focus();
		}
	}

	public async showOverlay(): Promise<void> {
		this.overlayWindow?.showInactive();
	}

	public async hideOverlay(): Promise<void> {
		this.overlayWindow?.hide();
	}

	public async destroyOverlay(): Promise<void> {
		this.stopHitTesting();
		if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
			this.overlayWindow.close();
		}
		this.overlayWindow = null;
		this.lastBounds = '';
	}

	public isOverlayVisible(): boolean {
		return !!this.overlayWindow && !this.overlayWindow.isDestroyed() && this.overlayWindow.isVisible();
	}

	public sendToOverlay(channel: string, ...args: any[]): void {
		if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
			this.overlayWindow.webContents.send(channel, ...args);
		}
	}

	public updateDeckData(deckData: any): void {
		this.sendToOverlay('deck-data-updated', deckData);
	}
}
