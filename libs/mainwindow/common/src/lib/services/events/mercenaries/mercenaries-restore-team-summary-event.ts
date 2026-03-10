import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesRestoreTeamSummaryEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesRestoreTeamSummaryEvent.eventName

	constructor(public readonly teamId: string) {}

	static readonly eventName = 'MercenariesRestoreTeamSummaryEvent'
}
