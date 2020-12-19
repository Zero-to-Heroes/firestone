import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsToggleExpandedRunEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsToggleExpandedRunEvent';
	}

	constructor(public readonly runId: string) {}

	public eventName(): string {
		return 'DuelsToggleExpandedRunEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
