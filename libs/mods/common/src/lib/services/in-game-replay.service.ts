import { Injectable } from '@angular/core';
import { GameStatusService } from '@firestone/shared/common/service';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import * as JSZip from 'jszip';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { ModsManagerService } from './mods-manager.service';

const WS_URL = 'ws://localhost:54321';
const WS_RECONNECT_DELAY = 3000;
const WS_CONNECT_TIMEOUT = 5000;
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
		// Do nothing
	}

	protected override createElectronProxy(ipcRenderer: any): void {
		// Do nothing
	}

	override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('showReplayInternal', (args: { powerLogKey: string; reviewId: string }) =>
			this.showReplayInternal(args),
		);
	}

	async showReplay(powerLogKey: string, reviewId: string) {
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
		} catch (e) {
			console.error('[in-game-replay] WebSocket connection failed', e);
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

	private ensureConnected(): Promise<void> {
		if (this.ws?.readyState === WebSocket.OPEN) {
			return Promise.resolve();
		}
		return this.connect();
	}

	private connect(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.disconnect();

			const timeout = setTimeout(() => {
				reject(new Error('WebSocket connection timed out'));
				this.ws?.close();
			}, WS_CONNECT_TIMEOUT);

			this.ws = new WebSocket(WS_URL);
			this.shouldReconnect = true;

			this.ws.onopen = () => {
				clearTimeout(timeout);
				console.log('[in-game-replay] WebSocket connected');
				resolve();
			};

			this.ws.onmessage = (event) => {
				this.handleMessage(event.data);
			};

			this.ws.onerror = (event) => {
				clearTimeout(timeout);
				console.warn('[in-game-replay] WebSocket error', event);
				reject(new Error('WebSocket connection error'));
			};

			this.ws.onclose = () => {
				console.log('[in-game-replay] WebSocket closed');
				this.ws = null;
				this.status$$.next({ type: 'status', state: 'idle' });
				this.scheduleReconnect();
			};
		});
	}

	disconnect(): void {
		this.shouldReconnect = false;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.ws) {
			this.ws.onclose = null;
			this.ws.onerror = null;
			this.ws.close();
			this.ws = null;
		}
	}

	private scheduleReconnect(): void {
		if (!this.shouldReconnect || this.reconnectTimer) {
			return;
		}
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			if (this.shouldReconnect) {
				this.connect().catch(() => {
					// Will retry via onclose → scheduleReconnect
				});
			}
		}, WS_RECONNECT_DELAY);
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
