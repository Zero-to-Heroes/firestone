import { OverwolfService } from '../../overwolf.service';
import { ProcessingQueue } from '../../processing-queue.service';

export class MindVisionOperationFacade<T> {
	private cachedValue: T;
	private timeout;

	private processingQueue = new ProcessingQueue<InternalCall<T>>(
		eventQueue => this.processQueue(eventQueue),
		1000,
		this.serviceName,
	);

	constructor(
		private ow: OverwolfService,
		private serviceName: string,
		private mindVisionOperation: () => Promise<any>,
		private emptyCheck: (input: any) => boolean,
		private transformer: (output: any) => T,
	) {}

	private async processQueue(eventQueue: readonly InternalCall<T>[]): Promise<readonly InternalCall<T>[]> {
		this.log('processing queue', eventQueue);
		// Since it's a queue of functions that build promises, we can't simply await the result
		return new Promise<readonly InternalCall<T>[]>(resolve => {
			const firstEvent = eventQueue[0];
			// The idea here is that once we have the result for one event, we resolve all
			// the pending events with the result from the first event
			this.log('resolving first event', eventQueue);
			// The process is not ideal - we should in fact give the control back to the queue after the
			// callinternal
			firstEvent.apply(firstEvent.retriesLeft, (returnValue: T, retriesLeft: number) => {
				if (!returnValue && retriesLeft > 0) {
					// We can still try again!
					this.log('\tno result, trying again', event, eventQueue, returnValue, retriesLeft);
					resolve([
						// Don't forget to update the number of retry attempts left
						Object.assign(firstEvent, { retriesLeft: firstEvent.retriesLeft - 1 } as InternalCall<T>),
						...eventQueue.slice(1),
					]);
					return;
				}
				if (!returnValue && retriesLeft <= 0) {
					// Could not get any result
					this.log('\tno result, returning', event, eventQueue);
					resolve([]);
					return;
				}
				// We got something, we ping everyone in the queue
				for (let i = 0; i < eventQueue.length; i++) {
					const event = eventQueue[i];
					this.log('\tresolving', event, eventQueue);
					event.resolve(returnValue ? this.transformer(returnValue) : returnValue);
					// Once all the processing is over, we return with an empty queue
					if (i === eventQueue.length - 1) {
						this.log('\tfinal return', i, eventQueue.length, eventQueue);
						resolve([]);
					}
				}
			});
		});
	}

	public async call(): Promise<T> {
		if (this.cachedValue) {
			// this.log('returning cached value', this.cachedValue);
			return this.cachedValue;
		}
		if (!(await this.ow.inGame())) {
			return null;
		}
		return new Promise<T>(resolve => {
			this.processingQueue.enqueue({
				retriesLeft: 20,
				// When processing the full queue in one go, we can use this to notify
				// all pending processes
				resolve: resolve,
				// Actually perform the operation, and the callback is called with the result
				// of the operation once it completes
				apply: (left: number, callback: (result: T, retriesLeft: number) => void) =>
					this.callInternal((returnValue: T, left: number) => {
						callback(returnValue, left);
					}, left),
			});
		});
	}

	private async callInternal(callback: (result: T, left: number) => void, retriesLeft: number) {
		if (this.cachedValue) {
			// this.log('returning cached value', this.cachedValue);
			callback(this.cachedValue, 0);
			return;
		}
		// if (retriesLeft <= 0) {
		// 	// There are cases where not retrieving the info it totally valid,
		// 	// like trying to get the BattlegroundsInfo right after logging in
		// 	this.log('coult not perform operation', new Error().stack);
		// 	callback(null);
		// 	return;
		// }
		if (!(await this.ow.inGame())) {
			callback(null, 0);
			return;
		}
		// this.log('performing oiperation', this.mindVisionOperation);
		const resultFromMemory = await this.mindVisionOperation();
		if (!resultFromMemory || this.emptyCheck(resultFromMemory)) {
			// this.log('result from memory is empty, retying', resultFromMemory);
			callback(null, retriesLeft - 1);
			// setTimeout(() => this.callInternal(callback, retriesLeft - 1), 1000);
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
		callback(this.cachedValue, retriesLeft - 1);
		return;
	}

	private log(...args) {
		console.log(`[memory-service] ${this.serviceName}`, args);
	}

	private error(...args) {
		console.error(`[memory-service] ${this.serviceName}`, args);
	}
}

interface InternalCall<T> {
	resolve;
	retriesLeft: number;
	apply: (retriesLeft: number, callback: (result: T, retriesLeft: number) => void) => Promise<void>;
}
