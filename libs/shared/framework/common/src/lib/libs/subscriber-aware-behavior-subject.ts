import { BehaviorSubject, Subscriber, Subscription } from 'rxjs';

export class SubscriberAwareBehaviorSubject<T> extends BehaviorSubject<T> {
	listeners: (() => void | PromiseLike<void>)[] = [];

	override getValue(): T {
		// console.debug('getting value', new Error().stack);
		this.triggerListeners();
		return super.getValue();
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
