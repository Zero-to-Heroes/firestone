import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsDeckbuilderHeroPowerSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsDeckbuilderHeroPowerSelectedEvent';
	}

	constructor(public readonly heroPowerCardId: string) {}

	public eventName(): string {
		return 'DuelsDeckbuilderHeroPowerSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
