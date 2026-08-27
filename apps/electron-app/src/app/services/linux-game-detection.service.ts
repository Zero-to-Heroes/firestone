import { ElectronGameWindowService } from '@firestone/electron/common';
import { GameWindowInfo } from '@firestone/shared/framework/core';
import { execFileSync } from 'child_process';
import { EventEmitter } from 'events';
import { readdirSync, readFileSync } from 'fs';

const HEARTHSTONE_CLASS_ID = 9898;
// Overwolf reports gameId = classId * 10 + variant; game-status checks Math.floor(id / 10).
const HEARTHSTONE_GAME_ID = HEARTHSTONE_CLASS_ID * 10 + 1;
const POLL_INTERVAL_MS = 1000;

export interface LinuxGameWindow {
	windowId: string;
	x: number;
	y: number;
	width: number;
	height: number;
	focused: boolean;
}

/**
 * Detects a Wine/Proton-hosted Hearthstone on Linux and feeds ElectronGameWindowService.
 *
 * The ow-electron overlay package (which normally emits game-launched / game-window-changed)
 * does not work on Linux, so the game is found the native way instead: the process via
 * /proc/<pid>/comm, and the window geometry via X11 EWMH properties. Wine windows are ordinary
 * managed X11 windows, so xprop/xwininfo see them like any other client.
 *
 * Emits: 'game-launched' | 'game-exit' | 'game-window-changed' | 'game-focus-changed'.
 */
export class LinuxGameDetectionService extends EventEmitter {
	private static instance: LinuxGameDetectionService;

	private timer: NodeJS.Timeout | null = null;
	private current: GameWindowInfo | null = null;
	private lastKey = '';

	private constructor(private readonly gameWindowService: ElectronGameWindowService) {
		super();
	}

	public static getInstance(gameWindowService: ElectronGameWindowService): LinuxGameDetectionService {
		if (!LinuxGameDetectionService.instance) {
			LinuxGameDetectionService.instance = new LinuxGameDetectionService(gameWindowService);
		}
		return LinuxGameDetectionService.instance;
	}

	public start(): void {
		if (this.timer) {
			return;
		}
		console.log('[linux-game-detection] starting Hearthstone detection (/proc + X11)');
		this.tick();
		this.timer = setInterval(() => this.tick(), POLL_INTERVAL_MS);
	}

	public stop(): void {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
	}

	public getGameWindow(): LinuxGameWindow | null {
		const pid = this.findHearthstonePid();
		return pid == null ? null : this.findGameWindow(pid);
	}

	private tick(): void {
		try {
			const pid = this.findHearthstonePid();
			if (pid == null) {
				if (this.current) {
					console.log('[linux-game-detection] Hearthstone exited');
					const previous = this.current;
					this.current = null;
					this.lastKey = '';
					this.gameWindowService.applyExternalGameInfo(null);
					this.emit('game-exit', previous);
				}
				return;
			}

			const win = this.findGameWindow(pid);
			if (!win) {
				// Process is up but the window is not mapped yet (still loading).
				return;
			}

			const info: GameWindowInfo = {
				success: true,
				isInFocus: win.focused,
				gameIsInFocus: win.focused,
				isRunning: true,
				title: 'Hearthstone',
				displayName: 'Hearthstone: Heroes of Warcraft',
				shortTitle: 'Hearthstone',
				id: HEARTHSTONE_GAME_ID,
				classId: HEARTHSTONE_CLASS_ID,
				width: win.width,
				height: win.height,
				logicalWidth: win.width,
				logicalHeight: win.height,
				executionPath: this.exePath(pid) ?? '',
				windowHandle: { value: parseInt(win.windowId, 16) || 0 },
				monitorHandle: { value: 0 },
				processId: pid,
			} as GameWindowInfo;

			const key = `${win.width}x${win.height}@${win.x},${win.y}:${win.focused}`;
			const launched = !this.current;
			this.current = info;

			// Only push downstream on a real change: game-status re-emits inGame$$ and fires its
			// start listeners on every notification, so notifying each tick would spam at 1Hz.
			if (!launched && key === this.lastKey) {
				return;
			}
			this.lastKey = key;

			if (launched) {
				console.log(`[linux-game-detection] Hearthstone detected pid=${pid} ${win.width}x${win.height}`);
			}
			this.gameWindowService.applyExternalGameInfo(info);

			if (launched) {
				this.emit('game-launched', info, win);
			}
			this.emit('game-window-changed', info, win);
			this.emit('game-focus-changed', win.focused, info, win);
		} catch (e) {
			console.error('[linux-game-detection] tick error', e);
		}
	}

	/** Wine keeps the .exe suffix in /proc/<pid>/comm, which the kernel truncates to 15 chars. */
	private findHearthstonePid(): number | null {
		for (const entry of readdirSync('/proc')) {
			if (!/^\d+$/.test(entry)) {
				continue;
			}
			let comm: string;
			try {
				comm = readFileSync(`/proc/${entry}/comm`, 'utf8').trim();
			} catch (e) {
				continue;
			}
			if (comm === 'Hearthstone.ex' || comm === 'Hearthstone.exe' || comm === 'Hearthstone') {
				return Number(entry);
			}
		}
		return null;
	}

	/**
	 * /proc/<pid>/exe points at the Wine loader, so take the game's PE path from its mappings.
	 * The path column starts at the first '/' and runs to end of line, so it must include spaces
	 * ("Program Files (x86)"). A \S* match would truncate at the first space.
	 */
	private exePath(pid: number): string | null {
		try {
			const maps = readFileSync(`/proc/${pid}/maps`, 'utf8');
			for (const line of maps.split('\n')) {
				const idx = line.indexOf('/');
				if (idx < 0) {
					continue;
				}
				const p = line.substring(idx).trim();
				if (/Hearthstone\.exe$/i.test(p)) {
					return p;
				}
			}
			return null;
		} catch (e) {
			return null;
		}
	}

	private sh(cmd: string, args: string[]): string {
		try {
			return execFileSync(cmd, args, { encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] });
		} catch (e) {
			return '';
		}
	}

	/**
	 * Finds the Hearthstone X11 window.
	 *
	 * Prefers matching _NET_WM_PID against the process we already found, which is exact. Falls
	 * back to an exact name match, since Wine does not always set _NET_WM_PID. Name matching must
	 * be exact: "Hearthstone Deck Tracker" and browser tabs would otherwise match.
	 */
	private findGameWindow(pid?: number): LinuxGameWindow | null {
		const list = this.sh('xprop', ['-root', '_NET_CLIENT_LIST']);
		const ids = list.match(/0x[0-9a-f]+/g) ?? [];
		const activeId = (this.sh('xprop', ['-root', '_NET_ACTIVE_WINDOW']).match(/0x[0-9a-f]+/) ?? [])[0];

		for (const id of ids) {
			const nameOut = this.sh('xprop', ['-id', id, '_NET_WM_NAME']);
			const name = (nameOut.match(/=\s*"(.*)"\s*$/m) ?? [])[1];

			let matches = name === 'Hearthstone';
			if (!matches && pid != null) {
				const pidOut = this.sh('xprop', ['-id', id, '_NET_WM_PID']);
				const wmPid = Number((pidOut.match(/=\s*(\d+)/) ?? [])[1]);
				matches = wmPid === pid;
			}
			if (!matches) {
				continue;
			}

			const info = this.sh('xwininfo', ['-id', id]);
			if (!/Map State:\s+IsViewable/.test(info)) {
				continue;
			}
			const num = (re: RegExp): number | null => {
				const m = info.match(re);
				return m ? parseInt(m[1], 10) : null;
			};
			const x = num(/Absolute upper-left X:\s+(-?\d+)/);
			const y = num(/Absolute upper-left Y:\s+(-?\d+)/);
			const width = num(/Width:\s+(\d+)/);
			const height = num(/Height:\s+(\d+)/);
			if (x == null || y == null || width == null || height == null) {
				continue;
			}

			return {
				windowId: id,
				x,
				y,
				width,
				height,
				focused: !!activeId && parseInt(activeId, 16) === parseInt(id, 16),
			};
		}
		return null;
	}
}
