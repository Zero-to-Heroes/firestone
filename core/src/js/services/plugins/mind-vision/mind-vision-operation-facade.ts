import { OverwolfService } from '../../overwolf.service';
import { ProcessingQueue } from '../../processing-queue.service';

export class MindVisionOperationFacade<T> {
	private processingQueue = new ProcessingQueue<InternalCall<T>>(
		(eventQueue) => this.processQueue(eventQueue),
		1000,
		this.serviceName,
	);

	constructor(
		private ow: OverwolfService,
		private serviceName: string,
		private mindVisionOperation: (forceReset?: boolean, input?: any) => Promise<any>,
		private emptyCheck: (input: any) => boolean,
		private transformer: (output: any) => T,
		private numberOfRetries = 3,
		private delay = 3000,
		private resetMindvisionIfEmpty: (info: any, retriesLeft?: number) => boolean = null,
	) {}

	private async processQueue(eventQueue: readonly InternalCall<T>[]): Promise<readonly InternalCall<T>[]> {
		// this.log('processing queue', eventQueue);
		// Since it's a queue of functions that build promises, we can't simply await the result
		return new Promise<readonly InternalCall<T>[]>((resolve) => {
			try {
				const firstEvent = eventQueue[0];
				// The idea here is that once we have the result for one event, we resolve all
				// the pending events with the result from the first event
				// this.log('resolving first event', eventQueue);
				// The process is not ideal - we should in fact give the control back to the queue after the
				// callinternal
				firstEvent.apply(firstEvent.retriesLeft, (returnValue: T, retriesLeft: number) => {
					if (!returnValue && retriesLeft > 0) {
						// We can still try again!
						// this.log('\tno result, trying again', event, eventQueue, returnValue, retriesLeft);
						resolve([
							// Don't forget to update the number of retry attempts left
							Object.assign(firstEvent, { retriesLeft: firstEvent.retriesLeft - 1 } as InternalCall<T>),
							...eventQueue.slice(1),
						]);
						return;
					}
					// We got something, we ping everyone in the queue
					for (let i = 0; i < eventQueue.length; i++) {
						const event = eventQueue[i];
						// this.log(
						// 	'\tresolving',
						// 	event,
						// 	this.transformer,
						// 	returnValue ? this.transformer(returnValue) : returnValue,
						// 	returnValue,
						// );
						// Already transformed before being passed to the callback
						event.resolve(returnValue);
						// Once all the processing is over, we return with an empty queue
						if (i === eventQueue.length - 1) {
							// this.log('\tfinal return', i, eventQueue.length, eventQueue);
							resolve([]);
						}
					}
				});
			} catch (e) {
				this.error('issue while processing queue', e);
				resolve([]);
			}
		});
	}

	public async call(numberOfRetries?: number, forceReset = false, input: any = null, timeoutMs = 30000): Promise<T> {
		if (!(await this.ow.inGame())) {
			return null;
		}
		// this.debug('race');
		return Promise.race([
			new Promise<T>((resolve) => {
				this.processingQueue.enqueue({
					retriesLeft: numberOfRetries ?? this.numberOfRetries,
					// When processing the full queue in one go, we can use this to notify
					// all pending processes
					resolve: resolve,
					// Actually perform the operation, and the callback is called with the result
					// of the operation once it completes
					apply: (left: number, callback: (result: T, retriesLeft: number) => void) =>
						this.callInternal(
							(returnValue: T, left: number) => {
								callback(returnValue, left);
							},
							input,
							left,
							forceReset,
						),
				});
			}),
			new Promise<T>((resolve) => {
				// Add a timeout, since no memory call should take too long to complete
				setTimeout(() => {
					resolve(null);
				}, timeoutMs);
			}),
		]);
	}

	private async callInternal(
		callback: (result: T, left: number) => void,
		input: any,
		retriesLeft: number,
		forceReset = false,
	) {
		if (!forceReset && retriesLeft <= 0) {
			// There are cases where not retrieving the info it totally valid,
			// like trying to get the BattlegroundsInfo right after logging in
			this.log('not getting any value', retriesLeft, forceReset);
			callback(null, retriesLeft);
			return;
		}
		if (!(await this.ow.inGame())) {
			this.log('not in game', retriesLeft, forceReset);
			callback(null, 0);
			return;
		}
		// this.log('performing oiperation', this.mindVisionOperation, retriesLeft);
		const resultFromMemory = await this.mindVisionOperation(forceReset, input);
		// this.log('result from memory', resultFromMemory);
		if (!forceReset && this.resetMindvisionIfEmpty && this.resetMindvisionIfEmpty(resultFromMemory, retriesLeft)) {
			// this.log('result empty, calling with a force reset', resultFromMemory);
			setTimeout(() => this.callInternal(callback, input, retriesLeft - 1, true));
			return;
		}
		if (!resultFromMemory || this.emptyCheck(resultFromMemory)) {
			// this.log('result from memory is empty, retying');
			setTimeout(() => this.callInternal(callback, input, retriesLeft - 1), this.delay);
			return;
		}
		// this.log('retrieved info from memory');
		const result = this.transformer(resultFromMemory);
		callback(result, retriesLeft - 1);
		return;
	}

	private debug(...args) {
		console.debug(`[memory-service] ${this.serviceName}`, ...args);
	}

	private log(...args) {
		console.log(`[memory-service] ${this.serviceName}`, ...args);
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
