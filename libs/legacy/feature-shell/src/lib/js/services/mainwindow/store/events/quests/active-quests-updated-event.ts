import { MemoryQuestsLog } from '../../../../plugins/mind-vision/operations/get-active-quests-operation';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ActiveQuestsUpdatedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ActiveQuestsUpdatedEvent';
	}

	constructor(public readonly data: MemoryQuestsLog) {}

	public eventName(): string {
		return 'ActiveQuestsUpdatedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
