import { QuestsInfo } from '@firestone-hs/reference-data';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ReferenceQuestsLoadedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ReferenceQuestsLoadedEvent';
	}

	constructor(public readonly data: QuestsInfo) {}

	public eventName(): string {
		return 'ReferenceQuestsLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
