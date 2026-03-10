import { MainWindowStoreEvent } from '../main-window-store-event';
import { MercenariesPveDifficultyFilterType } from '@firestone/mercenaries/common';

export class MercenariesPveDifficultyFilterSelectedEvent implements MainWindowStoreEvent {
	
	readonly eventName = MercenariesPveDifficultyFilterSelectedEvent.eventName

	constructor(public readonly difficulty: MercenariesPveDifficultyFilterType) {}

	static readonly eventName = 'MercenariesPveDifficultyFilterSelectedEvent'
}
