import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesAddMercToBackupTeamEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'MercenariesAddMercToBackupTeamEvent';
	}

	constructor(public readonly mercId: number) {}

	public eventName(): string {
		return 'MercenariesAddMercToBackupTeamEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
