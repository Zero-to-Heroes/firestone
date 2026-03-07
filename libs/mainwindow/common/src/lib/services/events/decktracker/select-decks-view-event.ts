import { MainWindowStoreEvent } from '../main-window-store-event';
import { DecktrackerViewType } from '../../../model/decktracker/decktracker-view.type';

export class SelectDecksViewEvent implements MainWindowStoreEvent {
	constructor(public readonly newView: DecktrackerViewType) {}

	public static eventName(): string {
		return 'SelectDecksViewEvent';
	}

	public eventName(): string {
		return 'SelectDecksViewEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
