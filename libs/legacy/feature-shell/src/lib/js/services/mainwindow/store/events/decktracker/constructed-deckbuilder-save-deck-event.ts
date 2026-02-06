import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class ConstructedDeckbuilderSaveDeckEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ConstructedDeckbuilderSaveDeckEvent';
	}

	constructor(
		public readonly deckstring: string,
		public readonly deckName: string,
	) {}

	public eventName(): string {
		return 'ConstructedDeckbuilderSaveDeckEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
