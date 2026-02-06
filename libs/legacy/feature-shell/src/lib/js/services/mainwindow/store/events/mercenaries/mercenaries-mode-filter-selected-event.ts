import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { MercenariesModeFilterType } from '../../../../../models/mercenaries/mercenaries-filter-types';

export class MercenariesModeFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly mode: MercenariesModeFilterType) {}

	public static eventName(): string {
		return 'MercenariesModeFilterSelectedEvent';
	}

	public eventName(): string {
		return 'MercenariesModeFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
