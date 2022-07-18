import { Race } from '@firestone-hs/reference-data';
import { BgsActiveTimeFilterType } from '../../../../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsRequestNewGlobalStatsLoadEvent implements MainWindowStoreEvent {
	constructor(public readonly tribes: readonly Race[], public readonly timePeriod: BgsActiveTimeFilterType) {}

	public static eventName(): string {
		return 'BgsRequestNewGlobalStatsLoadEvent';
	}

	public eventName(): string {
		return 'BgsRequestNewGlobalStatsLoadEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
