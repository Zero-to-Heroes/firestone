import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsDeckbuilderHeroSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsDeckbuilderHeroSelectedEvent';
	}

	constructor(public readonly heroCardId: string) {}

	public eventName(): string {
		return 'DuelsDeckbuilderHeroSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
