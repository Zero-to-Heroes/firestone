import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedToggleDeckVersionStatsEvent implements MainWindowStoreEvent {
	
	readonly eventName = ConstructedToggleDeckVersionStatsEvent.eventName

	static readonly eventName = 'ConstructedToggleDeckVersionStatsEvent'

	constructor(public readonly versionDeckstring: string) {}
}
