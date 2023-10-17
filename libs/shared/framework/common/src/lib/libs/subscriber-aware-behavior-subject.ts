import { BehaviorSubject, Subscriber, Subscription } from 'rxjs';
import { sleep } from './utils';

export class SubscriberAwareBehaviorSubject<T> extends BehaviorSubject<T> {
	listeners: (() => void | PromiseLike<void>)[] = [];

	override getValue(): T {
		// console.debug('getting value', new Error().stack);
		this.triggerListeners();
		return super.getValue();
	}

	public async getValueWithInit(
		uninitializedValue: T | null | undefined = null,
		timeToWaitBetweenChecksInMs = 200,
	): Promise<T> {
		// console.debug('getting value', new Error().stack);
		this.triggerListeners();
		let value = super.getValue();
		while (value == uninitializedValue) {
			await sleep(timeToWaitBetweenChecksInMs);
			value = super.getValue();
		}
		return value;
	}

	protected _subscribe(subscriber: Subscriber<T>): Subscription {
		// console.debug('subscribing', new Error().stack);
		this.triggerListeners();
		return super['_subscribe'](subscriber);
	}

	onFirstSubscribe(listener) {
		this.listeners.push(listener);
	}

	private triggerListeners() {
		for (const listener of this.listeners) {
			try {
				listener();
			} catch (e) {
				console.error(e);
			}
		}
		this.listeners = [];
	}
}
