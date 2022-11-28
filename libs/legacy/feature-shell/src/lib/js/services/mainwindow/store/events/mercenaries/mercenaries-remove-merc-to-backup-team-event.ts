import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesRemoveMercToBackupTeamEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'MercenariesRemoveMercToBackupTeamEvent';
	}

	constructor(public readonly mercId: number) {}

	public eventName(): string {
		return 'MercenariesRemoveMercToBackupTeamEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
