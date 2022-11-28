export class ProcessingQueue<T> {
	private eventQueue: readonly T[] = [];
	private pendingQueue: readonly T[] = [];
	private isProcessing = false;
	private interval = undefined;

	constructor(
		private readonly processingFunction: (eventQueue: readonly T[]) => Promise<readonly T[]>,
		private readonly processFrequency: number,
		private readonly queueName?: string,
	) {}

	public clear() {
		this.isProcessing = true;
		this.eventQueue = [];
		this.pendingQueue = [];
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
		this.isProcessing = false;
	}

	public eventsPendingCount(): number {
		return this.eventQueue.length + this.pendingQueue.length;
	}

	public async enqueue(event: T) {
		// What happens if this happens while we're waiting for the processingFunction
		// to complete? As it's async
		if (this.isProcessing) {
			// Don't modify the queue while processing is ongoing
			this.pendingQueue = [...this.pendingQueue, event];
		} else {
			this.eventQueue = [...this.eventQueue, event];
		}
		this.processQueue();
	}

	public async enqueueAll(events: T[]) {
		// What happens if this happens while we're waiting for the processingFunction
		// to complete? As it's async
		if (this.isProcessing) {
			// Don't modify the queue while processing is ongoing
			this.pendingQueue = [...this.pendingQueue, ...events];
		} else {
			this.eventQueue = [...this.eventQueue, ...events];
		}

		this.processQueue();
	}

	private async processQueue() {
		if (this.isProcessing) {
			return;
		}
		this.isProcessing = true;
		if (this.eventQueue.length === 0) {
			if (this.interval) {
				clearInterval(this.interval);
				this.interval = undefined;
			}
			this.isProcessing = false;
			return;
		}
		if (!this.interval) {
			this.interval = setInterval(() => this.processQueue(), this.processFrequency);
		}
		let hasEventBeenProcessed = true;
		// We processed some events, but not all
		// If no event has been processed, this could mean the processing function is waiting for something
		// so we just leave the processing loop
		while (this.eventQueue.length !== 0 && hasEventBeenProcessed) {
			const queueAfterProcess = await this.processingFunction([...this.eventQueue]);
			hasEventBeenProcessed = queueAfterProcess.length !== this.eventQueue.length;
			this.eventQueue = [...queueAfterProcess, ...this.pendingQueue];
			this.pendingQueue = [];
		}
		this.isProcessing = false;
	}
}
