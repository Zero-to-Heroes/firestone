import { Injectable, NgZone } from '@angular/core';
import { ReplayIndex } from '@firestone/replay/replay-parser';
import {
	deserializeReplayIndex,
	SerializedReplayIndex,
} from '../../../../libs/replay/replay-parser/src/lib/services/replay-index-transfer';
import { ReplayIndexWorker } from '@firestone/replay/coliseum';

@Injectable({ providedIn: 'root' })
export class ReplayIndexWorkerHostService implements ReplayIndexWorker {
	constructor(private readonly ngZone: NgZone) {}

	public buildFullIndexInWorker(xml: string): Promise<ReplayIndex | null> {
		if (typeof Worker === 'undefined') {
			return Promise.resolve(null);
		}

		return this.ngZone.runOutsideAngular(
			() =>
				new Promise((resolve) => {
					try {
						const worker = new Worker(new URL('../replay-index.worker', import.meta.url));
						const timeout = setTimeout(() => {
							worker.terminate();
							console.warn('[replay-index-worker] timed out');
							resolve(null);
						}, 30_000);

						worker.onmessage = (event: MessageEvent) => {
							clearTimeout(timeout);
							worker.terminate();
							if (event.data?.type === 'index' && event.data.index) {
								try {
									resolve(
										deserializeReplayIndex(event.data.index as SerializedReplayIndex),
									);
								} catch (error) {
									console.warn('[replay-index-worker] deserialize failed', error);
									resolve(null);
								}
							} else {
								console.warn('[replay-index-worker] unexpected message', event.data?.type);
								resolve(null);
							}
						};

						worker.onerror = (error) => {
							clearTimeout(timeout);
							worker.terminate();
							console.warn('[replay-index-worker] worker error', error);
							resolve(null);
						};

						worker.postMessage({ xml });
					} catch (error) {
						console.warn('[replay-index-worker] failed to spawn worker', error);
						resolve(null);
					}
				}),
		);
	}
}
