import { MainWindowStoreEvent } from '../main-window-store-event';

export class MercenariesSelectCompositionEvent implements MainWindowStoreEvent {
	constructor(public readonly compositionId: string) {}

	public static eventName(): string {
		return 'MercenariesSelectCompositionEvent';
	}

	public eventName(): string {
		return 'MercenariesSelectCompositionEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
