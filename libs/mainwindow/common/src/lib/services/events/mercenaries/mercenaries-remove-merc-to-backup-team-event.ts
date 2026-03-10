import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesRemoveMercToBackupTeamEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesRemoveMercToBackupTeamEvent.eventName

	static readonly eventName = 'MercenariesRemoveMercToBackupTeamEvent'

	constructor(public readonly mercId: number) {}
}
