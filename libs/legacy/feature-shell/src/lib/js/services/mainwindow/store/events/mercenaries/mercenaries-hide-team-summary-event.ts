import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesHideTeamSummaryEvent implements MainWindowStoreEvent {
	constructor(public readonly teamId: string) {}

	public static eventName(): string {
		return 'MercenariesHideTeamSummaryEvent';
	}

	public eventName(): string {
		return 'MercenariesHideTeamSummaryEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
