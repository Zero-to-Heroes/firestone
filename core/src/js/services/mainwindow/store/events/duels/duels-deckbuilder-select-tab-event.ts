import { DuelsDeckbuilderTabType } from '@models/duels/duels-deckbuilder';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsDeckbuilderSelectTabEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsDeckbuilderSelectTabEvent';
	}

	constructor(public readonly tab: DuelsDeckbuilderTabType) {}

	public eventName(): string {
		return 'DuelsDeckbuilderSelectTabEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
