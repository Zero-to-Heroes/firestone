import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class SelectBattlegroundsCategoryEvent implements MainWindowStoreEvent {
	constructor(public readonly categoryId: string) {}

	public static eventName(): string {
		return 'SelectBattlegroundsCategoryEvent';
	}

	public eventName(): string {
		return 'SelectBattlegroundsCategoryEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
