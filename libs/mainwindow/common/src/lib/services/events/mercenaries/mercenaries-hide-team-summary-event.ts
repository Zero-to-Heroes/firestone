import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesHideTeamSummaryEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesHideTeamSummaryEvent.eventName

	constructor(public readonly teamId: string) {}

	static readonly eventName = 'MercenariesHideTeamSummaryEvent'
}
