import { Race } from '@firestone-hs/reference-data';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsRequestNewGlobalStatsLoadEvent implements MainWindowStoreEvent {
	constructor(public readonly tribes: readonly Race[]) {}

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
