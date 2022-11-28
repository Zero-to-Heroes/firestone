import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedDeckbuilderImportDeckEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ConstructedDeckbuilderImportDeckEvent';
	}

	constructor(public readonly deckstring: string, public readonly deckName: string) {}

	public eventName(): string {
		return 'ConstructedDeckbuilderImportDeckEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
