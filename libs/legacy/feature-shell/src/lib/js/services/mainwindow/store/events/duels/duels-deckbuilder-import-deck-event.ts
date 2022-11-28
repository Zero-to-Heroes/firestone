import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsDeckbuilderImportDeckEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsDeckbuilderImportDeckEvent';
	}

	constructor(public readonly deckstring: string, public readonly deckName: string) {}

	public eventName(): string {
		return 'DuelsDeckbuilderImportDeckEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
