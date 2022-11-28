import { Race } from '@firestone-hs/reference-data';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsTribesFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly tribes: readonly Race[]) {}

	public static eventName(): string {
		return 'BgsTribesFilterSelectedEvent';
	}

	public eventName(): string {
		return 'BgsTribesFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
