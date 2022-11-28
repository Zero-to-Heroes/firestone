import { MainWindowStoreEvent } from '../main-window-store-event';

export class DuelsPersonalDeckRenameEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'DuelsPersonalDeckRenameEvent';
	}

	constructor(public readonly deckstring: string, public readonly newName: string) {}

	public eventName(): string {
		return 'DuelsPersonalDeckRenameEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
