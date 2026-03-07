import { MainWindowStoreEvent } from '../main-window-store-event';
import { MercenariesPveDifficultyFilterType } from '@firestone/mercenaries/common';

export class MercenariesPveDifficultyFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly difficulty: MercenariesPveDifficultyFilterType) {}

	public static eventName(): string {
		return 'MercenariesPveDifficultyFilterSelectedEvent';
	}

	public eventName(): string {
		return 'MercenariesPveDifficultyFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
