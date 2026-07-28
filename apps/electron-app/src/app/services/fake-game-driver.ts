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
 *
 * Fidelity notes:
 * - The overlay/BG windows only exist when ow-electron has injected into a running
 *   Hearthstone process. For a faithful IPC fan-out measurement, start Hearthstone and
 *   leave it at the menu; without it the replay still exercises parsing/serialization,
 *   but broadcasts have no overlay subscribers. The driver logs the window count at start.
 * - Like the Overwolf `window.fakeGame`, the scene is forced to BACON/GAMEPLAY and the
 *   GAME_SEED is randomized so the game is not treated as a reconnect. MindVision reads
 *   won't match the replayed game (they hit the real HS process, if any).
 * - The end-of-game flow runs for real, including the replay upload.
 */
import { Injector } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { GameEvents, GameStateService } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { feedPowerLogLinesPaced, trimPowerLogLinesToLastGame } from '@firestone/power-log-parser';
import { BrowserWindow } from 'electron';
import * as fs from 'fs';

export function startFakeGameDriver(injector: Injector): void {
	const logPath = process.env['FS_FAKE_GAME_LOG']?.trim();
	if (!logPath?.length) {
		return;
	}
	const speed = Number(process.env['FS_FAKE_GAME_SPEED'] ?? '1');
	const maxGapMs = Number(process.env['FS_FAKE_GAME_MAX_GAP_MS'] ?? '15000');
	const startDelayMs = Number(process.env['FS_FAKE_GAME_DELAY_MS'] ?? '20000');
	console.log('[fake-game] scheduled', JSON.stringify({ logPath, speed, maxGapMs, startDelayMs }));
	setTimeout(() => {
		runFakeGame(injector, logPath, speed, maxGapMs).catch((e) => {
			console.error('[fake-game] replay failed', e);
		});
	}, startDelayMs);
}

async function runFakeGame(injector: Injector, logPath: string, speed: number, maxGapMs: number): Promise<void> {
	if (!fs.existsSync(logPath)) {
		console.error('[fake-game] log file not found:', logPath);
		return;
	}
	const gameEvents = injector.get(GameEvents);
	const gameState = injector.get(GameStateService);
	const scene = injector.get(SceneService);

	const rawLines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/);
	const lines = trimPowerLogLinesToLastGame(rawLines).filter((line) => line.length > 0);
	const isBg = lines.some((line) => line.includes('GameType=GT_BATTLEGROUNDS'));
	console.log(
		'[fake-game] starting replay',
		JSON.stringify({
			lines: lines.length,
			isBg,
			windows: BrowserWindow.getAllWindows().length,
		}),
	);

	// Same forcing as the Overwolf window.fakeGame: BACON first triggers the BG real-time
	// stats wiring, GAMEPLAY is what the game-state pipeline gates on.
	if (isBg) {
		scene.currentScene$$.next(SceneMode.BACON);
	}
	scene.currentScene$$.next(SceneMode.GAMEPLAY);

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
			onProgress: (fed, total, elapsedMs) => {
				if (elapsedMs - lastProgressLog >= 30_000) {
					lastProgressLog = elapsedMs;
					console.log('[fake-game] progress', JSON.stringify({ fed, total, elapsedMs }));
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
		'[fake-game] done',
		JSON.stringify({
			lines: lines.length,
			feedMs,
			gameEventsDrainMs: queueIdle - feedDone,
			gameStateDrainMs: gsIdle - queueIdle,
			totalMs: Date.now() - start,
		}),
	);
}
