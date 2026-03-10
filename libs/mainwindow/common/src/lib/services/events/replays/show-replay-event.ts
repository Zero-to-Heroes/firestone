import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShowReplayEvent implements MainWindowStoreEvent {
	
	readonly eventName = ShowReplayEvent.eventName

	constructor(public readonly reviewId: string) {}

	static readonly eventName = 'ShowReplayEvent'
}
