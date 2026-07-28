import { join } from 'path';
import { Worker } from 'worker_threads';

export interface ComputeWorkerResponse {
	readonly id: number;
	readonly ok: boolean;
	readonly result?: string;
	readonly resultBytes?: Uint8Array;
	/** Structured-cloned object, for ops where re-stringifying would defeat the offload (parseJson) */
	readonly resultObject?: any;
	readonly error?: string;
	readonly done: boolean;
}

/** How long the worker may sit idle (no requests, keep-alive check false) before being released */
const IDLE_RELEASE_MS = 5 * 60 * 1000;

/**
 * Owns the single persistent compute worker of the Electron main process
 * (compute-worker.thread.ts): BGS battle sims (Plan F) and end-of-game upload prep
 * (Plan H), see docs/electron-memory-investigation.md.
 *
 * One long-lived worker means the cards DB is cloned to it once per app run (call
 * prewarm() after the cards are loaded so that clone doesn't land inside a
 * latency-sensitive window), instead of once per battle as before. Requests are
 * processed sequentially by the worker; that's intended — it also serializes CPU
 * bursts instead of stacking them.
 *
 * The idle worker costs ~130 MB resident inside main's OS process (V8 isolate +
 * cards copy + sim tables), so when it has been idle for IDLE_RELEASE_MS and the
 * keep-alive check is false (wired to "is Hearthstone running"), it is released.
 * Any later request transparently respawns it — the respawn cost on main is the
 * cards structured clone (~450 ms, probed as worker/init-cards-clone), which is why
 * callers should prewarm() again when a latency-sensitive phase approaches (done on
 * game launch in electron-app-injector-setup.ts).
 *
 * On worker crash/exit all in-flight requests resolve to null (callers fall back or
 * skip) and the next request respawns the worker.
 */
export class ComputeWorkerHost {
	private worker: Worker | null = null;
	private requestId = 0;
	private pending = new Map<number, (response: ComputeWorkerResponse | null) => void>();
	private idleTimer: NodeJS.Timeout | null = null;
	private keepAliveCheck: () => Promise<boolean> = async () => false;

	constructor(private readonly cardsProvider: () => any) {}

	/** While this resolves true (eg Hearthstone is running), the idle timer only re-arms */
	public setKeepAliveCheck(check: () => Promise<boolean>): void {
		this.keepAliveCheck = check;
	}

	public prewarm(): void {
		try {
			this.ensureWorker();
		} catch (e) {
			console.error('[compute-worker] could not prewarm worker', e);
		}
	}

	/** Single-response request; resolves to null on failure or timeout so callers can fall back */
	public async request(payload: object, timeoutMs = 120_000): Promise<ComputeWorkerResponse | null> {
		try {
			const worker = this.ensureWorker();
			const id = ++this.requestId;
			return await new Promise<ComputeWorkerResponse | null>((resolve) => {
				const timeout = setTimeout(() => {
					console.warn('[compute-worker] request timed out', id);
					this.pending.delete(id);
					resolve(null);
				}, timeoutMs);
				this.pending.set(id, (response) => {
					clearTimeout(timeout);
					this.pending.delete(id);
					this.armIdleTimer();
					if (response && !response.ok) {
						console.warn('[compute-worker] request failed', id, response.error);
						resolve(null);
					} else {
						resolve(response);
					}
				});
				worker.postMessage({ id: id, ...payload });
			});
		} catch (e) {
			console.error('[compute-worker] could not run request in worker', e);
			return null;
		}
	}

	/**
	 * Streaming request: onMessage is called for every response (done: false for
	 * intermediate results), and with null if the worker fails mid-stream. The
	 * subscription is removed after the done: true message.
	 */
	public stream(payload: object, onMessage: (response: ComputeWorkerResponse | null) => void): void {
		let worker: Worker;
		try {
			worker = this.ensureWorker();
		} catch (e) {
			console.error('[compute-worker] could not run stream in worker', e);
			onMessage(null);
			return;
		}
		const id = ++this.requestId;
		this.pending.set(id, (response) => {
			if (!response || response.done) {
				this.pending.delete(id);
				this.armIdleTimer();
			}
			onMessage(response);
		});
		worker.postMessage({ id: id, ...payload });
	}

	private ensureWorker(): Worker {
		if (this.worker) {
			return this.worker;
		}

		// In production, __dirname points to dist/apps/electron-app/ (where main.js is),
		// and the worker file is bundled next to it by build-worker.js
		const workerPath = join(__dirname, 'compute-worker.thread.js');
		console.log('[compute-worker] spawning worker', workerPath);
		const worker = new Worker(workerPath);
		worker.on('message', (response: ComputeWorkerResponse) => {
			this.pending.get(response.id)?.(response);
		});
		worker.on('error', (error: Error) => {
			console.error('[compute-worker] worker error', error?.message ?? error, error?.stack ?? '');
			this.discardWorker(worker);
		});
		worker.on('exit', (code) => {
			console.warn('[compute-worker] worker exited with code', code);
			this.discardWorker(worker);
		});
		// postMessage structured-clones the whole cards DB on the calling thread —
		// report it to the stall-attribution hook (suspected cause of the ~2.4s
		// startup stall seen in session 6)
		const initStart = performance.now();
		worker.postMessage({ type: 'init', cards: this.cardsProvider() });
		(globalThis as any).__fsSlowOp?.('worker', 'init-cards-clone', performance.now() - initStart);
		this.worker = worker;
		this.armIdleTimer();
		return worker;
	}

	private armIdleTimer() {
		if (this.idleTimer) {
			clearTimeout(this.idleTimer);
		}
		if (!this.worker) {
			this.idleTimer = null;
			return;
		}
		this.idleTimer = setTimeout(() => this.onIdleTimeout(), IDLE_RELEASE_MS);
	}

	private async onIdleTimeout() {
		if (!this.worker) {
			this.idleTimer = null;
			return;
		}
		if (this.pending.size > 0) {
			this.armIdleTimer();
			return;
		}
		let keepAlive = false;
		try {
			keepAlive = await this.keepAliveCheck();
		} catch (e) {
			console.warn('[compute-worker] keep-alive check failed, releasing', e);
		}
		// Re-check: a request may have started while the (possibly async) check ran
		if (keepAlive || this.pending.size > 0) {
			this.armIdleTimer();
			return;
		}
		console.log('[compute-worker] idle for', IDLE_RELEASE_MS / 1000, 's and no game running, releasing worker');
		this.discardWorker(this.worker);
	}

	private discardWorker(worker: Worker) {
		if (this.worker === worker) {
			this.worker = null;
		}
		if (this.idleTimer) {
			clearTimeout(this.idleTimer);
			this.idleTimer = null;
		}
		const pending = [...this.pending.values()];
		this.pending.clear();
		for (const notify of pending) {
			notify(null);
		}
		worker.terminate();
	}
}
