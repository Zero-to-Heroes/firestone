/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Deque from 'double-ended-queue';

/** @deprecated */
export class ProcessingQueue<T> {
	private eventQueue: Deque<T> = new Deque<T>();
	private pendingQueue: Deque<T> = new Deque<T>();
	private isProcessing = false;
	private processingTimer: NodeJS.Timeout | null = null;

	constructor(
		private readonly processingFunction: (eventQueue: readonly T[]) => Promise<readonly T[]>,
		private readonly processFrequency: number, // Frequency in milliseconds
		private readonly queueName?: string,
		queueSize?: number,
	) {
		if (queueSize) {
			this.eventQueue = new Deque<T>(2000);
			this.pendingQueue = new Deque<T>(queueSize);
		}
	}

	public clear() {
		this.eventQueue.clear();
		this.pendingQueue.clear();
		this.isProcessing = false;

		// Clear the timer if it exists
		this.stopProcessingInterval();
	}

	public eventsPendingCount(): number {
		return this.eventQueue.length + this.pendingQueue.length;
	}

	public enqueue(event: T) {
		this.pendingQueue.push(event);
		this.startProcessingInterval();
	}

	public enqueueAll(events: T[]) {
		for (const event of events) {
			this.pendingQueue.push(event);
		}
		this.startProcessingInterval();
	}

	private startProcessingInterval() {
		// If an interval is already running, do nothing
		if (this.processingTimer) {
			return;
		}

		// Start an interval to process the queue at the specified frequency
		this.processingTimer = setInterval(async () => {
			if (!this.isProcessing) {
				await this.processQueue();
			}
		}, this.processFrequency);
	}

	private stopProcessingInterval() {
		// Clear the interval if it exists
		if (this.processingTimer) {
			clearInterval(this.processingTimer);
			this.processingTimer = null;
		}
	}

	private async processQueue() {
		// Prevent concurrent processing
		if (this.isProcessing) {
			return;
		}

		this.isProcessing = true;

		try {
			while (this.pendingQueue.length > 0 || this.eventQueue.length > 0) {
				// Move pending events to the event queue
				if (this.eventQueue.length < 50 && this.pendingQueue.length > 0) {
					const batchSize = Math.min(1000, this.pendingQueue.length);
					const batch: T[] = [];
					for (let i = 0; i < batchSize; i++) {
						const item = this.pendingQueue.shift(); // Efficient dequeue
						if (item !== undefined) {
							batch.push(item);
						}
					}
					this.eventQueue.push(...batch);
				}

				console.debug(
					'[ProcessingQueue] Processing queue',
					this.eventQueue.length + this.pendingQueue.length,
					this.queueName,
				);

				// Process the current queue
				const queueAfterProcess = await this.processingFunction(this.eventQueue.toArray());

				// If no events were processed, break the loop to avoid infinite processing
				if (queueAfterProcess.length === this.eventQueue.length) {
					console.warn('[ProcessingQueue] No events processed, exiting processing loop');
					break;
				}

				// Update the event queue with the remaining events
				this.eventQueue = new Deque(queueAfterProcess as T[]);
			}
		} catch (error) {
			console.error('[ProcessingQueue] Error during queue processing', error);
		} finally {
			this.isProcessing = false;

			// Stop the interval if there are no pending or event queue items
			if (this.pendingQueue.length === 0 && this.eventQueue.length === 0) {
				this.stopProcessingInterval();
			}
		}
	}
}
