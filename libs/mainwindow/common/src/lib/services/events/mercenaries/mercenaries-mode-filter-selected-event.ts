import { MainWindowStoreEvent } from '../main-window-store-event';
import { MercenariesModeFilterType } from '@firestone/mercenaries/common';

export class MercenariesModeFilterSelectedEvent implements MainWindowStoreEvent {
	readonly eventName = MercenariesModeFilterSelectedEvent.eventName

	constructor(public readonly mode: MercenariesModeFilterType) {}

	static readonly eventName = 'MercenariesModeFilterSelectedEvent'
}
