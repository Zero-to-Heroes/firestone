import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsDeckbuilderSignatureTreasureSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsDeckbuilderSignatureTreasureSelectedEvent';
	}

	constructor(public readonly signatureTreasureCardId: string) {}

	public eventName(): string {
		return 'DuelsDeckbuilderSignatureTreasureSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
