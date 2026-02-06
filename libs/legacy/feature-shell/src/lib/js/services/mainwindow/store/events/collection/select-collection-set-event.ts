import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class SelectCollectionSetEvent implements MainWindowStoreEvent {
	constructor(setId: string) {
		this.setId = setId;
	}
	readonly setId: string;

	public static eventName(): string {
		return 'SelectCollectionSetEvent';
	}

	public eventName(): string {
		return 'SelectCollectionSetEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
