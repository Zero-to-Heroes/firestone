export class ProcessingQueue<T> {
	private eventQueue: readonly T[] = [];
	private isProcessing = false;
	private interval = undefined;

	constructor(
		private readonly processingFunction: (eventQueue: readonly T[]) => Promise<readonly T[]>,
		private readonly processFrequency: number,
	) {
		this.init();
	}

	private async init() {}

	public enqueue(event: T) {
		this.eventQueue = [...this.eventQueue, event];
		this.processQueue();
	}

	private async processQueue() {
		// console.log('interval - processing queue');
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
		this.eventQueue = await this.processingFunction([...this.eventQueue]);
		this.isProcessing = false;
	}
}
