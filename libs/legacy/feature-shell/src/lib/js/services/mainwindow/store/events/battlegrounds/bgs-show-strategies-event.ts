import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsShowStrategiesEvent implements MainWindowStoreEvent {
	constructor(public readonly heroId: string) {}

	public static eventName(): string {
		return 'BgsShowStrategiesEvent';
	}

	public eventName(): string {
		return 'BgsShowStrategiesEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
