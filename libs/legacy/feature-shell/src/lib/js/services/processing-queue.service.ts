/** @deprecated */
export class ProcessingQueue<T> {
	private eventQueue: T[] = [];
	private pendingQueue: T[] = [];
	private isProcessing = false;
	private processingTimer: NodeJS.Timeout | null = null;

	constructor(
		private readonly processingFunction: (eventQueue: readonly T[]) => Promise<readonly T[]>,
		private readonly processFrequency: number, // Frequency in milliseconds
		private readonly queueName?: string,
	) {}

	public clear() {
		this.eventQueue = [];
		this.pendingQueue = [];
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
		this.pendingQueue.push(...events);
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
				if (this.pendingQueue.length > 0) {
					this.eventQueue.push(...this.pendingQueue);
					this.pendingQueue = [];
				}

				console.debug('[ProcessingQueue] Processing queue', this.eventQueue.length);

				// Process the current queue
				const queueAfterProcess = await this.processingFunction(this.eventQueue);

				// If no events were processed, break the loop to avoid infinite processing
				if (queueAfterProcess.length === this.eventQueue.length) {
					console.warn('[ProcessingQueue] No events processed, exiting processing loop');
					break;
				}

				// Update the event queue with the remaining events
				this.eventQueue = queueAfterProcess as T[];
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
