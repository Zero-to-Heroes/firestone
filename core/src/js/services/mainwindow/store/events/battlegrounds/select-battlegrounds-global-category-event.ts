import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectBattlegroundsGlobalCategoryEvent implements MainWindowStoreEvent {
	constructor(public readonly globalCategoryId: string) {}

	public static eventName(): string {
		return 'SelectBattlegroundsGlobalCategoryEvent';
	}

	public eventName(): string {
		return 'SelectBattlegroundsGlobalCategoryEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
