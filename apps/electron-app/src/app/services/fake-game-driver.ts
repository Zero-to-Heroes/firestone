/**
 * Fake-game replay driver for the Electron main process.
 *
 * Replays a recorded Power.log through the real production pipeline (GameEvents parsing,
 * GameState, facade IPC broadcast to whatever windows are open, BGS sims in the compute
 * worker, end-of-game upload) at the pace of the original game, using the log line
 * timestamps. This mirrors live-game behavior far more closely than a fast feed: batching
 * windows, per-turn broadcast cadence and stall patterns all depend on the arrival rate.
 *
 * Enabled entirely through env vars so measurement sessions can run unattended
 * (typically together with FS_ELECTRON_MEM=1):
 *
 * - FS_FAKE_GAME_LOG:        path to the Power.log to replay (required to activate)
 * - FS_FAKE_GAME_SPEED:      playback speed multiplier (default 1 = real time; 0 = as
 *                            fast as possible)
 * - FS_FAKE_GAME_MAX_GAP_MS: cap on idle gaps between lines, pre-speed (default 15000)
 * - FS_FAKE_GAME_DELAY_MS:   wait after app boot before starting the replay, so windows
 *                            and services settle (default 20000)
 * - FS_FAKE_GAME_REPEAT:     how many times to replay the log in-process (default 1)
 * - FS_FAKE_GAME_SETTLE_MS:  pause after each iteration once queues are idle (default 0;
 *                            use ~20000 for cross-game leak sessions so widgets settle)
 * - FS_FAKE_GAME_PAUSE_EVERY_LINES / FS_FAKE_GAME_PAUSE_MS:
 *                            extra yield during feed so overlay widgets can mount
 *                            (default 0 = off; e.g. every 4000 lines, 750 ms)
 *
 * Fidelity notes:
 * - The overlay/BG windows only exist when ow-electron has injected into a running
 *   Hearthstone process. For a faithful IPC fan-out measurement, start Hearthstone and
 *   leave it at the menu; without it the replay still exercises parsing/serialization,
 *   but broadcasts have no overlay subscribers. The driver logs the window count at start.
 * - Like the Overwolf `window.fakeGame`, the scene is forced to BACON/GAMEPLAY and the
 *   GAME_SEED is randomized so the game is not treated as a reconnect. MindVision reads
 *   won't match the replayed game (they hit the real HS process, if any) — so we **keep
 *   re-pinning GAMEPLAY** for the whole session; otherwise MindVision flips scene back to
 *   HUB and all overlay widgets unmount.
 * - The end-of-game flow runs for real, including the replay upload.
 */
import { Injector } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { GameEvents, GameStateService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import {
	feedPowerLogLinesPaced,
	findLastGameStartLineIndex,
	trimPowerLogLinesToLastGame,
} from '@firestone/power-log-parser';
import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import { notifyFakeGameReplayDone, rearmHeapSnapshotTurns } from './memory-instrumentation.service';

export function startFakeGameDriver(injector: Injector): void {
	const logPath = process.env['FS_FAKE_GAME_LOG']?.trim();
	if (!logPath?.length) {
		return;
	}
	const speed = Number(process.env['FS_FAKE_GAME_SPEED'] ?? '1');
	const maxGapMs = Number(process.env['FS_FAKE_GAME_MAX_GAP_MS'] ?? '15000');
	const startDelayMs = Number(process.env['FS_FAKE_GAME_DELAY_MS'] ?? '20000');
	const repeat = Math.max(1, Math.floor(Number(process.env['FS_FAKE_GAME_REPEAT'] ?? '1') || 1));
	const settleMs = Math.max(0, Number(process.env['FS_FAKE_GAME_SETTLE_MS'] ?? '0') || 0);
	const pauseEveryLines = Math.max(0, Math.floor(Number(process.env['FS_FAKE_GAME_PAUSE_EVERY_LINES'] ?? '0') || 0));
	const pauseMs = Math.max(0, Number(process.env['FS_FAKE_GAME_PAUSE_MS'] ?? '0') || 0);
	console.log(
		'[fake-game] scheduled',
		JSON.stringify({ logPath, speed, maxGapMs, startDelayMs, repeat, settleMs, pauseEveryLines, pauseMs }),
	);
	setTimeout(() => {
		runFakeGame(injector, {
			logPath,
			speed,
			maxGapMs,
			repeat,
			settleMs,
			pauseEveryLines,
			pauseMs,
		}).catch((e) => {
			console.error('[fake-game] replay failed', e);
		});
	}, startDelayMs);
}

/** Wait until the overlay BrowserWindow exists (ow-electron inject), so heap/RSS measure the HUD. */
async function waitForOverlayWindow(timeoutMs = 120_000): Promise<boolean> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		const hit = BrowserWindow.getAllWindows().some((w) => {
			try {
				const url = w.webContents?.getURL?.() ?? '';
				return url.includes('#/overlay') || url.includes('/overlay');
			} catch {
				return false;
			}
		});
		if (hit) {
			console.log('[fake-game] overlay window ready', JSON.stringify({ waitedMs: Date.now() - start }));
			return true;
		}
		await new Promise((r) => setTimeout(r, 1000));
	}
	console.warn('[fake-game] overlay window not found within timeout — continuing anyway');
	return false;
}

/**
 * Like trimPowerLogLinesToLastGame, but keeps the DebugPrintGame metadata block that
 * immediately precedes CREATE_GAME (BuildNumber / GameType / …). Without it, NewGameHandler
 * crashes on undefined CurrentGame.BuildNumber when the fixture is a mid-game cut that only
 * has a PowerTaskList CREATE_GAME.
 */
function trimPowerLogLinesToLastGameWithMeta(rawLines: readonly string[]): string[] {
	const createIdx = findLastGameStartLineIndex(rawLines);
	if (createIdx == null) {
		return trimPowerLogLinesToLastGame(rawLines);
	}
	let from = createIdx;
	for (let i = createIdx - 1; i >= 0; i--) {
		const line = rawLines[i] ?? '';
		if (!line.trim()) {
			continue;
		}
		if (line.includes('DebugPrintGame()') || line.includes('PowerTaskList.DebugDump()')) {
			from = i;
			continue;
		}
		break;
	}
	return rawLines.slice(from).filter((line) => line.length > 0);
}

async function runFakeGame(
	injector: Injector,
	opts: {
		logPath: string;
		speed: number;
		maxGapMs: number;
		repeat: number;
		settleMs: number;
		pauseEveryLines: number;
		pauseMs: number;
	},
): Promise<void> {
	const { logPath, speed, maxGapMs, repeat, settleMs, pauseEveryLines, pauseMs } = opts;
	if (!fs.existsSync(logPath)) {
		console.error('[fake-game] log file not found:', logPath);
		return;
	}
	await waitForOverlayWindow(Number(process.env['FS_FAKE_GAME_OVERLAY_WAIT_MS'] ?? '120000'));
	const gameEvents = injector.get(GameEvents);
	const gameState = injector.get(GameStateService);
	const scene = injector.get(SceneService);

	const rawLines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/);
	const lines = trimPowerLogLinesToLastGameWithMeta(rawLines);
	const isBg =
		lines.some((line) => line.includes('GameType=GT_BATTLEGROUNDS')) ||
		lines.some((line) => line.includes('BACON_BARTENDER_CARD_ID'));
	console.log(
		'[fake-game] ready',
		JSON.stringify({
			lines: lines.length,
			isBg,
			hasBuildNumber: lines.some((line) => line.includes('BuildNumber=')),
			windows: BrowserWindow.getAllWindows().length,
			repeat,
			settleMs,
			pauseEveryLines,
			pauseMs,
		}),
	);

	// Same forcing as the Overwolf window.fakeGame: BACON first triggers the BG real-time
	// stats wiring, GAMEPLAY is what overlay widgets gate on. Pin for the whole multi-game
	// session — MindVision will keep publishing HUB while HS sits at the menu.
	const unpinScene = pinGameplayScene(scene, isBg);

	try {
		for (let iteration = 1; iteration <= repeat; iteration++) {
			if (iteration > 1) {
				rearmHeapSnapshotTurns();
			}
			console.log(
				'[fake-game] iteration start',
				JSON.stringify({ iteration, of: repeat, lines: lines.length, scene: scene.currentScene$$.value }),
			);
			const start = Date.now();
			let lastProgressLog = 0;
			const feedMs = await feedPowerLogLinesPaced(
				lines,
				(line) => {
					// Randomize the seed so the replayed game is not treated as a reconnect
					if (line.includes('tag=GAME_SEED')) {
						line = line.replace(/value=\d+/, `value=${Math.floor(Math.random() * 1000000)}`);
					}
					gameEvents.receiveLogLine(line);
				},
				{
					speed: speed > 0 ? speed : 10_000,
					maxGapMs: speed > 0 ? maxGapMs : 0,
					pauseEveryLines,
					pauseMs,
					onProgress: (fed, total, elapsedMs) => {
						if (elapsedMs - lastProgressLog >= 30_000) {
							lastProgressLog = elapsedMs;
							console.log(
								'[fake-game] progress',
								JSON.stringify({ iteration, fed, total, elapsedMs }),
							);
						}
					},
				},
			);
			const feedDone = Date.now();
			await gameEvents.awaitProcessingQueueIdle();
			const queueIdle = Date.now();
			await gameState.awaitQueueIdle();
			const gsIdle = Date.now();
			console.log(
				'[fake-game] iteration done',
				JSON.stringify({
					iteration,
					of: repeat,
					lines: lines.length,
					feedMs,
					gameEventsDrainMs: queueIdle - feedDone,
					gameStateDrainMs: gsIdle - queueIdle,
					totalMs: Date.now() - start,
					scene: scene.currentScene$$.value,
				}),
			);
			// Mid-game cuts never emit GAME_END; still take pending turn-N heap snapshots.
			// On multi-game full matches, GAME_END already snapped; this is a no-op then.
			notifyFakeGameReplayDone();
			if (iteration < repeat && settleMs > 0) {
				console.log('[fake-game] settle', JSON.stringify({ iteration, settleMs }));
				await new Promise((r) => setTimeout(r, settleMs));
			}
		}
		console.log('[fake-game] all iterations done', JSON.stringify({ repeat }));
		// Keep scene pinned afterward so mid-game visual checks still see overlay widgets.
	} catch (e) {
		unpinScene();
		throw e;
	}
}

/**
 * Hold SceneMode.GAMEPLAY for the fake-game session. Without this, MindVision's menu
 * scene (HUB) overwrites the one-shot force and every overlay widget unmounts.
 * Left active after a mid-game cut so the HUD stays visible for inspection.
 */
function pinGameplayScene(scene: SceneService, isBg: boolean): () => void {
	const force = (reason: string) => {
		const cur = scene.currentScene$$.value;
		if (cur === SceneMode.GAMEPLAY) {
			return;
		}
		console.log('[fake-game] pinning GAMEPLAY', JSON.stringify({ reason, was: cur, isBg }));
		if (isBg && cur !== SceneMode.BACON) {
			// Preserve BACON as lastNonGamePlay for BG mode-family helpers.
			scene.currentScene$$.next(SceneMode.BACON);
		}
		scene.currentScene$$.next(SceneMode.GAMEPLAY);
	};

	force('start');
	const sub = scene.currentScene$$.subscribe((s) => {
		if (s !== SceneMode.GAMEPLAY) {
			queueMicrotask(() => force('mindvision-overwrite'));
		}
	});
	const interval = setInterval(() => force('interval'), 1000);
	return () => {
		sub.unsubscribe();
		clearInterval(interval);
	};
}
