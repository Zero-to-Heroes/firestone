import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedDeckbuilderGoBackEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ConstructedDeckbuilderGoBackEvent';
	}

	constructor(public readonly step: 'format' | 'class') {}

	public eventName(): string {
		return 'ConstructedDeckbuilderGoBackEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
