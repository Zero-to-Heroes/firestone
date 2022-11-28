import { SceneMode } from '@firestone-hs/reference-data';
import { MainWindowStoreEvent } from './main-window-store-event';

export class SceneChangedEvent implements MainWindowStoreEvent {
	constructor(public readonly scene: SceneMode) {}

	public static eventName(): string {
		return 'SceneChangedEvent';
	}

	public eventName(): string {
		return 'SceneChangedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
