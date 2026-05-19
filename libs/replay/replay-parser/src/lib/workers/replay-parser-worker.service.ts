import { Injectable, NgZone } from '@angular/core';

export interface ReplayIndexWorkerResult {
	readonly turnCount: number;
	readonly totalDuration: number;
	readonly turnTimestamps: readonly number[];
}

@Injectable({
	providedIn: 'root',
})
export class ReplayParserWorkerService {
	constructor(private readonly ngZone: NgZone) {}

	public buildIndexInWorker(xml: string): Promise<ReplayIndexWorkerResult | null> {
		if (typeof Worker === 'undefined') {
			return Promise.resolve(null);
		}

		return this.ngZone.runOutsideAngular(
			() =>
				new Promise((resolve) => {
					try {
						const worker = new Worker(new URL('./replay-index.worker', import.meta.url));
						const timeout = setTimeout(() => {
							worker.terminate();
							resolve(null);
						}, 30_000);

						worker.onmessage = (event: MessageEvent) => {
							clearTimeout(timeout);
							worker.terminate();
							if (event.data?.type === 'index') {
								resolve({
									turnCount: event.data.turnCount,
									totalDuration: event.data.totalDuration,
									turnTimestamps: event.data.turnTimestamps,
								});
							} else {
								resolve(null);
							}
						};

						worker.onerror = () => {
							clearTimeout(timeout);
							worker.terminate();
							resolve(null);
						};

						worker.postMessage({ xml });
					} catch {
						resolve(null);
					}
				}),
		);
	}
}
