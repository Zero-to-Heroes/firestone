import { CollectionCardType } from '../../../../../models/collection/collection-card-type.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class NewCardEvent implements MainWindowStoreEvent {
	constructor(
		public readonly cardId: string,
		public readonly type: CollectionCardType,
		public readonly newCount: number,
		public readonly isDust: boolean,
	) {}

	public static eventName(): string {
		return 'NewCardEvent';
	}

	public eventName(): string {
		return 'NewCardEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
