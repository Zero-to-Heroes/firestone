import { MercenariesReferenceData } from '../../../../mercenaries/mercenaries-state-builder.service';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesReferenceDataLoadedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'MercenariesReferenceDataLoadedEvent';
	}

	constructor(public readonly data: MercenariesReferenceData) {}

	public eventName(): string {
		return 'MercenariesReferenceDataLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
