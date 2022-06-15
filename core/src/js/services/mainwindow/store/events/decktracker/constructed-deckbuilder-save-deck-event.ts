import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedDeckbuilderSaveDeckEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ConstructedDeckbuilderSaveDeckEvent';
	}

	constructor(public readonly deckstring: string, public readonly deckName: string) {}

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
