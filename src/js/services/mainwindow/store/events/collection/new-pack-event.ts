import { MainWindowStoreEvent } from '../main-window-store-event';

export class NewPackEvent implements MainWindowStoreEvent {
	constructor(setId: string, packCards: readonly any[]) {
		this.setId = setId;
		this.packCards = packCards;
	}
	readonly setId: string;
	readonly packCards: readonly any[];

	public static eventName(): string {
		return 'NewPackEvent';
	}

	public eventName(): string {
		return 'NewPackEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return true;
	}
}
