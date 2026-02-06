import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class SearchCardsEvent implements MainWindowStoreEvent {
	constructor(searchString: string) {
		this.searchString = searchString;
	}
	readonly searchString: string;

	public static eventName(): string {
		return 'SearchCardsEvent';
	}

	public eventName(): string {
		return 'SearchCardsEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
