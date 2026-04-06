import { Injectable } from '@angular/core';
import { GameStatusService } from '@firestone/shared/common/service';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import * as JSZip from 'jszip';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { ModsManagerService } from './mods-manager.service';

/** Prefer 127.0.0.1 first — the mod listens on IPv4 loopback; `localhost` may resolve to ::1 first. */
const WS_URLS = ['ws://127.0.0.1:54321', 'ws://localhost:54321'] as const;
const WS_RECONNECT_DELAY = 3000;
const WS_RECONNECT_MAX_DELAY = 30000;
const WS_CONNECT_TIMEOUT = 5000;
const WS_ENSURE_TOTAL_MS = 5000;
const WS_ENSURE_ATTEMPT_DELAY_MS = 350;
const S3_BASE_URL = 'https://power.firestoneapp.com/';
const MARK_ACCESSED_ENDPOINT = 'https://gkd7rn4gqzt2lqbhtlqbiez5w40awjqg.lambda-url.us-west-2.on.aws/';

export interface ReplayStatus {
	type: 'status';
	state: 'idle' | 'loading' | 'playing' | 'paused';
	elapsed?: number;
	total?: number;
	speed?: number;
}

export interface ReplayAck {
	type: 'ack';
	action: string;
	fileId?: string;
}

export interface ReplayError {
	type: 'error';
	message: string;
}

export type ReplayMessage = ReplayStatus | ReplayAck | ReplayError;

export const IN_GAME_REPLAY_ERROR_MESSAGES: Record<string, string> = {
	'not-in-game': 'Hearthstone is not running',
	'mod-not-installed': 'Replay mod is not installed',
	'mod-not-active': 'Replay mod is not active',
	'connection-failed': 'Could not connect to the replay mod',
	'download-failed': 'Could not download the replay',
	'rewind-block': 'Rewind replays are not supported yet',
};

@Injectable({ providedIn: 'root' })
export class InGameReplayService extends AbstractFacadeService<InGameReplayService> {
	public status$$: BehaviorSubject<ReplayStatus>;
	/** True when a replay is loading, playing, or paused. Use this to gate uploads and tracking. */
	public isReplayOngoing$$: BehaviorSubject<boolean>;

	/** Synchronous check — true when a replay is active (not idle). */
	get isReplayOngoing(): boolean {
		return this.status$$.value.state !== 'idle';
	}

	private ws: WebSocket | null = null;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private shouldReconnect = false;
	private reconnectDelay = WS_RECONNECT_DELAY;
	private urlIndex = 0;

	private modsManager: ModsManagerService;
	private gameStatus: GameStatusService;
	private api: ApiRunner;

	constructor(windowManager: WindowManagerService) {
		super(windowManager, 'InGameReplayService', () => !!this.status$$);
	}

	protected override assignSubjects(): void {
		this.status$$ = this.mainInstance.status$$;
		this.isReplayOngoing$$ = this.mainInstance.isReplayOngoing$$;
	}

	protected override init(): void | Promise<void> {
		this.status$$ = new BehaviorSubject<ReplayStatus>({ type: 'status', state: 'idle' });
		this.isReplayOngoing$$ = new BehaviorSubject<boolean>(false);
		this.modsManager = AppInjector.get(ModsManagerService);
		this.gameStatus = AppInjector.get(GameStatusService);
		this.api = AppInjector.get(ApiRunner);

		this.status$$
			.pipe(
				map((s) => s.state !== 'idle'),
				distinctUntilChanged(),
			)
			.subscribe((ongoing) => {
				console.log('[in-game-replay] isReplayOngoing', ongoing);
				this.isReplayOngoing$$.next(ongoing);
			});
	}

	protected override initElectronSubjects(): void {
		this.setupElectronSubject(this.status$$, 'InGameReplayService-status');
		this.setupElectronSubject(this.isReplayOngoing$$, 'InGameReplayService-isReplayOngoing');
	}

	protected override createElectronProxy(ipcRenderer: any): void {
		this.status$$ = new BehaviorSubject<ReplayStatus>({ type: 'status', state: 'idle' });
		this.isReplayOngoing$$ = new BehaviorSubject<boolean>(false);
	}

	override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('showReplayInternal', (args: { powerLogKey: string; reviewId: string }) =>
			this.showReplayInternal(args),
		);
	}

	async showReplay(
		powerLogKey: string,
		reviewId: string,
	): Promise<
		| 'not-in-game'
		| 'mod-not-installed'
		| 'mod-not-active'
		| 'connection-failed'
		| 'started'
		| 'download-failed'
		| 'rewind-block'
	> {
		return this.callOnMainProcess('showReplayInternal', { powerLogKey, reviewId });
	}
	private async showReplayInternal(args: {
		powerLogKey: string;
		reviewId: string;
	}): Promise<
		| 'not-in-game'
		| 'mod-not-installed'
		| 'mod-not-active'
		| 'connection-failed'
		| 'started'
		| 'download-failed'
		| 'rewind-block'
	> {
		const inGame = await this.gameStatus.inGame();
		if (!inGame) {
			return 'not-in-game';
		}

		const mods = this.modsManager.modsData$$.value;
		const replayMod = mods?.find((m) => m.AssemblyName === 'com.firestoneapp.mods.bepinex.ReplayViewer');
		console.log('[in-game-replay] replayMod', replayMod, mods);
		if (!replayMod) {
			return 'mod-not-installed';
		}

		if (!replayMod.Registered || !replayMod.alreadyInstalled) {
			return 'mod-not-active';
		}

		try {
			await this.ensureConnected();
		} catch {
			return 'connection-failed';
		}

		let textContent: string;
		try {
			// Download the replay file in the app (browser/Overwolf) and
			// extract if zip, then send the raw Power.log text to the mod.
			// The game process can't reliably make HTTPS requests or extract zips.
			const url = S3_BASE_URL + args.powerLogKey;
			console.log('[in-game-replay] Downloading replay from', url, args.powerLogKey, args.reviewId);

			const response = await fetch(url);
			if (!response.ok) {
				console.error('[in-game-replay] Download failed:', response.status, response.statusText);
				return 'download-failed';
			}

			if (args.powerLogKey.endsWith('.zip')) {
				const buffer = await response.arrayBuffer();
				textContent = await this.extractPowerLogFromZip(buffer);
			} else {
				textContent = await response.text();
			}
		} catch (e) {
			console.error('[in-game-replay] Failed to download replay', e);
			return 'download-failed';
		}

		console.log(`[in-game-replay] Power.log content: ${textContent.length} chars`);

		this.markPowerLogAsAccessed(args.reviewId, args.powerLogKey);

		const hasRewindBlock = textContent.includes('BLOCK_START BlockType=GAME_RESET');
		if (hasRewindBlock) {
			return 'rewind-block';
		}

		try {
			// Tell the mod to expect raw Power.log text in the next message
			this.send({ action: 'startReplayRaw' });
			// Send the raw Power.log text directly — no base64, no JSON wrapping
			this.sendRaw(textContent);
			return 'started';
		} catch (e) {
			console.error('[in-game-replay] Failed to send startReplay command', e);
			return 'connection-failed';
		}
	}

	private async extractPowerLogFromZip(buffer: ArrayBuffer): Promise<string> {
		const zip = await JSZip.loadAsync(buffer);
		const match = Object.keys(zip.files).find(
			(name) => name.toLowerCase().includes('power') || name.endsWith('.log'),
		);
		if (!match) {
			throw new Error(`No Power.log found in zip. Files: ${Object.keys(zip.files).join(', ')}`);
		}
		return zip.files[match].async('text');
	}

	private markPowerLogAsAccessed(reviewId: string, powerLogKey: string): void {
		this.api
			.callPostApi(MARK_ACCESSED_ENDPOINT, { reviewId, powerLogKey })
			.then(() => console.log('[in-game-replay] Marked power log as accessed', reviewId))
			.catch((err) => console.warn('[in-game-replay] Failed to mark power log as accessed', reviewId, err));
	}

	// --- WebSocket lifecycle ---

	private async ensureConnected(): Promise<void> {
		if (this.ws?.readyState === WebSocket.OPEN) {
			return;
		}
		this.reconnectDelay = WS_RECONNECT_DELAY;
		const deadline = Date.now() + WS_ENSURE_TOTAL_MS;
		let lastError: Error | undefined;
		while (Date.now() < deadline) {
			for (const url of WS_URLS) {
				if (this.ws?.readyState === WebSocket.OPEN) {
					return;
				}
				try {
					await this.connectSingle(url);
					return;
				} catch (e) {
					lastError = e instanceof Error ? e : new Error(String(e));
					console.debug('[in-game-replay] connect attempt failed', url, lastError.message);
				}
			}
			if (Date.now() < deadline) {
				await new Promise((r) => setTimeout(r, WS_ENSURE_ATTEMPT_DELAY_MS));
			}
		}
		console.warn('[in-game-replay] WebSocket connection failed after retries', lastError?.message);
		throw lastError ?? new Error('WebSocket connection failed');
	}

	/** Single attempt; used by reconnect scheduler (alternates URL via `urlIndex`). */
	private connect(): Promise<void> {
		return this.connectSingle(WS_URLS[this.urlIndex]);
	}

	private connectSingle(url: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.closeExistingSocket();

			let settled = false;
			const safeResolve = () => {
				if (settled) {
					return;
				}
				settled = true;
				resolve();
			};
			const safeReject = (err: Error) => {
				if (settled) {
					return;
				}
				settled = true;
				reject(err);
			};

			const timeout = setTimeout(() => {
				safeReject(new Error('WebSocket connection timed out'));
				this.closeExistingSocket();
			}, WS_CONNECT_TIMEOUT);

			const ws = new WebSocket(url);
			this.ws = ws;

			ws.onopen = () => {
				if (this.ws !== ws) {
					return;
				}
				clearTimeout(timeout);
				this.reconnectDelay = WS_RECONNECT_DELAY;
				const idx = (WS_URLS as readonly string[]).indexOf(url);
				if (idx >= 0) {
					this.urlIndex = idx;
				}
				this.shouldReconnect = true;
				console.log('[in-game-replay] WebSocket connected', url);
				safeResolve();
			};

			ws.onmessage = (event) => {
				if (this.ws !== ws) {
					return;
				}
				this.handleMessage(event.data);
			};

			ws.onerror = () => {
				if (this.ws !== ws) {
					return;
				}
				clearTimeout(timeout);
				console.debug('[in-game-replay] WebSocket error', url);
				safeReject(new Error('WebSocket connection error'));
			};

			ws.onclose = (event) => {
				if (this.ws !== ws) {
					return;
				}
				clearTimeout(timeout);
				const code = event?.code ?? '?';
				const reason = event?.reason || 'unknown';
				console.debug('[in-game-replay] WebSocket closed', url, 'code=', code, 'reason=', reason);
				this.ws = null;
				this.status$$.next({ type: 'status', state: 'idle' });
				if (this.shouldReconnect) {
					this.scheduleReconnect();
				}
			};
		});
	}

	private closeExistingSocket(): void {
		if (!this.ws) {
			return;
		}
		const ws = this.ws;
		this.ws = null;
		ws.onopen = null;
		ws.onmessage = null;
		ws.onerror = null;
		ws.onclose = null;
		try {
			ws.close();
		} catch {
			/* ignore */
		}
	}

	disconnect(): void {
		this.shouldReconnect = false;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		this.closeExistingSocket();
	}

	private scheduleReconnect(): void {
		if (!this.shouldReconnect || this.reconnectTimer) {
			return;
		}
		const delay = this.reconnectDelay;
		this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, WS_RECONNECT_MAX_DELAY);
		this.urlIndex = (this.urlIndex + 1) % WS_URLS.length;
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			if (this.shouldReconnect) {
				this.connect().catch(() => {
					// Will retry via onclose → scheduleReconnect
				});
			}
		}, delay);
	}

	// --- Messaging ---

	private send(message: Record<string, unknown>): void {
		if (this.ws?.readyState !== WebSocket.OPEN) {
			throw new Error('WebSocket is not connected');
		}
		this.ws.send(JSON.stringify(message));
	}

	private sendRaw(text: string): void {
		if (this.ws?.readyState !== WebSocket.OPEN) {
			throw new Error('WebSocket is not connected');
		}
		this.ws.send(text);
	}

	private handleMessage(raw: string): void {
		try {
			const msg: ReplayMessage = JSON.parse(raw);
			switch (msg.type) {
				case 'status':
					this.status$$.next(msg);
					break;
				case 'ack':
					console.log('[in-game-replay] ack:', msg.action, msg.fileId ?? '');
					break;
				case 'error':
					console.error('[in-game-replay] server error:', msg.message);
					break;
			}
		} catch (e) {
			console.warn('[in-game-replay] Failed to parse message', raw, e);
		}
	}

	// --- Public commands ---

	async pause(): Promise<void> {
		await this.ensureConnected();
		this.send({ action: 'pause' });
	}

	async resume(): Promise<void> {
		await this.ensureConnected();
		this.send({ action: 'resume' });
	}

	async setSpeed(speed: number): Promise<void> {
		await this.ensureConnected();
		this.send({ action: 'setSpeed', speed });
	}

	async playAgain(): Promise<void> {
		await this.ensureConnected();
		this.send({ action: 'playAgain' });
	}

	async leave(): Promise<void> {
		await this.ensureConnected();
		this.send({ action: 'leave' });
	}

	async getStatus(): Promise<void> {
		await this.ensureConnected();
		this.send({ action: 'getStatus' });
	}
}
