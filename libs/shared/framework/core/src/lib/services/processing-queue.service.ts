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
		if (this.processingTimer) {
			clearTimeout(this.processingTimer);
			this.processingTimer = null;
		}
	}

	public eventsPendingCount(): number {
		return this.eventQueue.length + this.pendingQueue.length;
	}

	public enqueue(event: T) {
		this.pendingQueue.push(event);
		this.scheduleProcessing();
	}

	public enqueueAll(events: T[]) {
		this.pendingQueue.push(...events);
		this.scheduleProcessing();
	}

	private scheduleProcessing() {
		// If a timer is already set, do nothing
		if (this.processingTimer) {
			return;
		}

		// Schedule the processing to occur after the specified frequency
		this.processingTimer = setTimeout(async () => {
			await this.processQueue();
		}, this.processFrequency);
	}

	private async processQueue() {
		// Prevent concurrent processing
		if (this.isProcessing) {
			return;
		}

		this.isProcessing = true;

		try {
			// Move pending events to the event queue
			this.eventQueue.push(...this.pendingQueue);
			this.pendingQueue = [];

			while (this.eventQueue.length > 0) {
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

			// Clear the timer after processing
			if (this.processingTimer) {
				clearTimeout(this.processingTimer);
				this.processingTimer = null;
			}

			// If there are new pending events, schedule the next batch
			if (this.pendingQueue.length > 0) {
				this.scheduleProcessing();
			}
		}
	}
}
