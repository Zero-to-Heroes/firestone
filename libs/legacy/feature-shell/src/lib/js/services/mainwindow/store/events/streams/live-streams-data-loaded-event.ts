import { PresenceResult } from '@firestone-hs/twitch-presence';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class LiveStreamsDataLoadedEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'LiveStreamsDataLoadedEvent';
	}

	constructor(public readonly data: PresenceResult) {}

	public eventName(): string {
		return 'LiveStreamsDataLoadedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
