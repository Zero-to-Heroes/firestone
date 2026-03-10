import { MainWindowStoreEvent } from '../main-window-store-event';

export class DecktrackerResetDeckStatsEvent implements MainWindowStoreEvent {
	
	readonly eventName = DecktrackerResetDeckStatsEvent.eventName

	constructor(public readonly deckstring: string) {}

	static readonly eventName = 'DecktrackerResetDeckStatsEvent'
}
