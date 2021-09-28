import { MercenariesModeFilterType } from '../../../../../models/mercenaries/mercenaries-mode-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

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
