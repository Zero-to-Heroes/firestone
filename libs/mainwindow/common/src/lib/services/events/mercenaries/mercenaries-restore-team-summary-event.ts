import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesRestoreTeamSummaryEvent implements MainWindowStoreEvent {
	constructor(public readonly teamId: string) {}

	public static eventName(): string {
		return 'MercenariesRestoreTeamSummaryEvent';
	}

	public eventName(): string {
		return 'MercenariesRestoreTeamSummaryEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
