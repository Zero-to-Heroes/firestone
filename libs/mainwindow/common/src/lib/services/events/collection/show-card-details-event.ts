import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowCardDetailsEvent implements MainWindowStoreEvent {
	constructor(cardId: string) {
		this.cardId = cardId;
	}
	readonly cardId: string;

	public static eventName(): string {
		return 'ShowCardDetailsEvent';
	}

	public eventName(): string {
		return 'ShowCardDetailsEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
