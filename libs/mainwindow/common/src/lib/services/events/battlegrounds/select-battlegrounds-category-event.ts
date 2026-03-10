import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectBattlegroundsCategoryEvent implements MainWindowStoreEvent {
	
	readonly eventName = SelectBattlegroundsCategoryEvent.eventName

	constructor(public readonly categoryId: string) {}

	static readonly eventName = 'SelectBattlegroundsCategoryEvent'
}
