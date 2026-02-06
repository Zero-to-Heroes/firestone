import { MainWindowStoreEvent } from '@firestone/mainwindow/common';
import { MercenariesPersonalHeroesSortCriteriaType } from '../../../../../models/mercenaries/personal-heroes-sort-criteria.type';

export class MercenariesPersonalHeroesSortEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'MercenariesPersonalHeroesSortEvent';
	}

	constructor(public readonly criteria: MercenariesPersonalHeroesSortCriteriaType) {}

	public eventName(): string {
		return 'MercenariesPersonalHeroesSortEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
