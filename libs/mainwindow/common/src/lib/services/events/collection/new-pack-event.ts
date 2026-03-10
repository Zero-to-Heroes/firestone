import { MainWindowStoreEvent } from '../main-window-store-event';
import { InternalCardInfo } from '@firestone/collection/data-access';

export class NewPackEvent implements MainWindowStoreEvent {
	readonly eventName = NewPackEvent.eventName

	constructor(
		public readonly setId: string,
		public readonly boosterId: number,
		public readonly packCards: readonly InternalCardInfo[],
	) {}

	static readonly eventName = 'NewPackEvent'
}
