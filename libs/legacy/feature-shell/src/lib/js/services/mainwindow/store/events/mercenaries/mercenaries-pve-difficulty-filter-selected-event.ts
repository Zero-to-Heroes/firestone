import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { MercenariesPveDifficultyFilterType } from '../../../../../models/mercenaries/mercenaries-filter-types';

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
