import { MainWindowStoreEvent } from '../main-window-store-event';

export class ToggleShowOnlyNewCardsInHistoryEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ToggleShowOnlyNewCardsInHistoryEvent';
	}

	public eventName(): string {
		return 'ToggleShowOnlyNewCardsInHistoryEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
