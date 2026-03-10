import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesAddMercToBackupTeamEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesAddMercToBackupTeamEvent.eventName

	static readonly eventName = 'MercenariesAddMercToBackupTeamEvent'

	constructor(public readonly mercId: number) {}
}
