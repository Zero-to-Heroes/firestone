/**
 * Newest-first, single-flight lane for battle-sim requests to the shared persistent
 * compute worker (Plan F, docs/electron-memory-investigation.md).
 *
 * Why: the worker processes one message at a time, and a battle sim occupies it for
 * its whole duration. When the app starts mid-game (log catch-up) or reconnects,
 * every past face-off fires a sim almost at once; posting them all to the worker
 * would serialize minutes of stale sims AHEAD of the live battle's one, so the sim
 * the user is actually watching never seems to complete (and other worker ops
 * starve behind the backlog). The old spawn-per-fight design ran them in parallel,
 * which is why this never showed before.
 *
 * The lane keeps at most ONE sim in the worker and always starts the most recently
 * requested sim first. Stale sims are not dropped — they run afterward, so their
 * face-offs still resolve in the battles tab — they just don't block the live one.
 */
export class SimRequestLane {
	/** Pending sim starters, oldest first — drained from the END (newest first) */
	private queue: (() => void)[] = [];
	private running = false;

	/** `start` receives a `done` callback that must be invoked when the sim's final
	 * (or error) response arrives; extra invocations are ignored. */
	public enqueue(start: (done: () => void) => void): void {
		this.queue.push(() => {
			let completed = false;
			start(() => {
				if (completed) {
					return;
				}
				completed = true;
				this.running = false;
				this.drain();
			});
		});
		if (this.queue.length > 1) {
			console.log('[bgs-simulation] sim lane busy,', this.queue.length, 'sims queued (newest runs first)');
		}
		this.drain();
	}

	public get pendingCount(): number {
		return this.queue.length + (this.running ? 1 : 0);
	}

	private drain(): void {
		if (this.running) {
			return;
		}
		const next = this.queue.pop();
		if (!next) {
			return;
		}
		this.running = true;
		next();
	}
}
