import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsDeckbuilderGoBackEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsDeckbuilderGoBackEvent';
	}

	constructor(public readonly step: 'hero' | 'hero-power' | 'signature-treasure') {}

	public eventName(): string {
		return 'DuelsDeckbuilderGoBackEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
