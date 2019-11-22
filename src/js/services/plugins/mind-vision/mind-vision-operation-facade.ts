import { ProcessingQueue } from '../../processing-queue.service';

export class MindVisionOperationFacade<T> {
	private cachedValue: T;
	private timeout;

	private processingQueue = new ProcessingQueue<InternalCall>(
		eventQueue => this.processQueue(eventQueue),
		100,
		this.serviceName,
	);

	constructor(
		private serviceName: string,
		private mindVisionOperation: () => Promise<any>,
		private emptyCheck: (input: any) => boolean,
		private transformer: (output: any) => T,
	) {}

	private async processQueue(eventQueue: readonly InternalCall[]): Promise<readonly InternalCall[]> {
		const event = eventQueue[0];
		// Since it's a queue of functions that build promises, we can't simply await the result
		return new Promise<readonly InternalCall[]>(resolve => {
			event(() => {
				resolve(eventQueue.slice(1));
			});
		});
	}

	public async call(): Promise<T> {
		if (this.cachedValue) {
			// this.log('returning cached value', this.cachedValue);
			return this.cachedValue;
		}
		return new Promise<T>(resolve => {
			this.processingQueue.enqueue(callback =>
				this.callInternal((returnValue: T) => {
					resolve(returnValue ? this.transformer(returnValue) : returnValue);
					callback();
				}, 20),
			);
			// this.callInternal((returnValue: T) => resolve(this.transformer(returnValue)), 20);
		});
	}

	private async callInternal(callback, retriesLeft = 20) {
		if (this.cachedValue) {
			// this.log('returning cached value', this.cachedValue);
			callback(this.cachedValue);
			return;
		}
		if (retriesLeft <= 0) {
			// There are cases where not retrieving the info it totally valid,
			// like trying to get the BattlegroundsInfo right after logging in
			this.log('coult not perform operation');
			callback(null);
			return;
		}
		// this.log('performing oiperation', this.mindVisionOperation);
		const resultFromMemory = await this.mindVisionOperation();
		if (!resultFromMemory || this.emptyCheck(resultFromMemory)) {
			// this.log('result from memory is empty, retying', resultFromMemory);
			setTimeout(() => this.callInternal(callback, retriesLeft - 1), 2000);
			return;
		}
		this.log('retrieved info from memory', resultFromMemory);
		this.cachedValue = resultFromMemory;
		if (!this.timeout) {
			this.timeout = setTimeout(() => {
				this.cachedValue = null;
				this.timeout = null;
			}, 3000);
		}
		callback(this.cachedValue);
		return;
	}

	private log(...args) {
		console.log(`[memory-service] ${this.serviceName}`, args);
	}

	private error(...args) {
		console.error(`[memory-service] ${this.serviceName}`, args);
	}
}

type InternalCall = (callback) => Promise<void>;
