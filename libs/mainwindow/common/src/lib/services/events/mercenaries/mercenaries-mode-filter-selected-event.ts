import { MainWindowStoreEvent } from '../main-window-store-event';
import { MercenariesModeFilterType } from '@firestone/mercenaries/common';

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
