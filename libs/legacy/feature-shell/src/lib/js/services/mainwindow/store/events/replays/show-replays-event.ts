import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class ShowReplaysEvent implements MainWindowStoreEvent {
	constructor(
		public readonly deckstring: string,
		public readonly gameMode: string,
	) {}

	public static eventName(): string {
		return 'ShowReplaysEvent';
	}

	public eventName(): string {
		return 'ShowReplaysEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
