import { Injectable } from '@angular/core';
import { GlobalStats } from '@firestone-hs/build-global-stats/dist/model/global-stats';
import { ReviewMessage } from '@firestone-hs/build-global-stats/dist/review-message';
import {
	BattleResultHistory,
	BgsFaceOff,
	BgsPlayer,
	BgsPostMatchStats,
} from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { UploadPrepExecutorService } from '@firestone/stats/services';
import { join } from 'path';
import { Worker } from 'worker_threads';

/**
 * Electron implementation of UploadPrepExecutorService (Plan H,
 * docs/electron-memory-investigation.md): runs the replay-XML parses and DEFLATE
 * zips of the end-of-game upload pipeline in a persistent worker_threads worker,
 * instead of blocking the main thread for seconds after GAME_END.
 *
 * The worker is spawned lazily on first use and kept alive across games, so the
 * cards database is only cloned to it once. Any failure resolves the pending calls
 * to null, which makes the callers fall back to their main-thread path.
 */
@Injectable()
export class UploadPrepWorkerService extends UploadPrepExecutorService {
	private worker: Worker | null = null;
	private requestId = 0;
	private pending = new Map<number, (response: WorkerResponse | null) => void>();

	constructor(private readonly cards: CardsFacadeService) {
		super();
	}

	public async parseBattlegroundsGame(
		replayXml: string,
		mainPlayer: BgsPlayer,
		battleResultHistory: readonly BattleResultHistory[],
		faceOffs: readonly BgsFaceOff[],
	): Promise<BgsPostMatchStats | null> {
		const response = await this.request({
			type: 'parseBattlegroundsGame',
			xml: replayXml,
			mainPlayer: mainPlayer,
			battleResultHistory: battleResultHistory,
			faceOffs: faceOffs,
		});
		return response?.ok && response.result ? JSON.parse(response.result) : null;
	}

	public async extractStatsForGame(message: ReviewMessage, replayXml: string): Promise<GlobalStats | null> {
		const response = await this.request({
			type: 'extractStatsForGame',
			message: message,
			xml: replayXml,
		});
		return response?.ok && response.result ? JSON.parse(response.result) : null;
	}

	public async zipSingleFile(fileName: string, content: string): Promise<Uint8Array | null> {
		const response = await this.request({
			type: 'zipSingleFile',
			fileName: fileName,
			content: content,
		});
		return response?.ok && response.resultBytes ? response.resultBytes : null;
	}

	private async request(payload: object): Promise<WorkerResponse | null> {
		try {
			const worker = this.ensureWorker();
			const id = ++this.requestId;
			return await new Promise<WorkerResponse | null>((resolve) => {
				const timeout = setTimeout(() => {
					console.warn('[upload-prep] worker request timed out', id);
					this.pending.delete(id);
					resolve(null);
				}, 120_000);
				this.pending.set(id, (response) => {
					clearTimeout(timeout);
					this.pending.delete(id);
					if (response && !response.ok) {
						console.warn('[upload-prep] worker request failed', id, response.error);
						resolve(null);
					} else {
						resolve(response);
					}
				});
				worker.postMessage({ id: id, ...payload });
			});
		} catch (e) {
			console.error('[upload-prep] could not run request in worker', e);
			return null;
		}
	}

	private ensureWorker(): Worker {
		if (this.worker) {
			return this.worker;
		}

		// In production, __dirname points to dist/apps/electron-app/ (where main.js is),
		// and the worker file is bundled next to it by build-worker.js
		const workerPath = join(__dirname, 'upload-prep-worker.thread.js');
		console.log('[upload-prep] spawning worker', workerPath);
		const worker = new Worker(workerPath);
		worker.on('message', (response: WorkerResponse) => {
			this.pending.get(response.id)?.(response);
		});
		worker.on('error', (error: Error) => {
			console.error('[upload-prep] worker error', error?.message ?? error, error?.stack ?? '');
			this.discardWorker(worker);
		});
		worker.on('exit', (code) => {
			console.warn('[upload-prep] worker exited with code', code);
			this.discardWorker(worker);
		});
		worker.postMessage({ type: 'init', cards: this.cards.getService() });
		this.worker = worker;
		return worker;
	}

	private discardWorker(worker: Worker) {
		if (this.worker === worker) {
			this.worker = null;
		}
		const pending = [...this.pending.values()];
		this.pending.clear();
		for (const resolve of pending) {
			resolve(null);
		}
		worker.terminate();
	}
}

interface WorkerResponse {
	readonly id: number;
	readonly ok: boolean;
	readonly result?: string;
	readonly resultBytes?: Uint8Array;
	readonly error?: string;
}
