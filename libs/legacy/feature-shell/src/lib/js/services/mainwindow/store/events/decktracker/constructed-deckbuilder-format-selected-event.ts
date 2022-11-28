import { GameFormatString } from '@firestone-hs/reference-data';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class ConstructedDeckbuilderFormatSelectedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ConstructedDeckbuilderFormatSelectedEvent';
	}

	constructor(public readonly format: GameFormatString) {}

	public eventName(): string {
		return 'ConstructedDeckbuilderFormatSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
