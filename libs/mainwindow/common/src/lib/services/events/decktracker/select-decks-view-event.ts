import { MainWindowStoreEvent } from '../main-window-store-event';
import { DecktrackerViewType } from '@firestone/shared/common/service';

export class SelectDecksViewEvent implements MainWindowStoreEvent {
	
	readonly eventName = SelectDecksViewEvent.eventName

	constructor(public readonly newView: DecktrackerViewType) {}

	static readonly eventName = 'SelectDecksViewEvent'
}
