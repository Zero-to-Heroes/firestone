import { BattlegroundsAppState } from '../../../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BgsAppInitEvent implements MainWindowStoreEvent {
	constructor(public readonly battlegroundsAppState: BattlegroundsAppState) {}

	public static eventName(): string {
		return 'BgsAppInitEvent';
	}

	public eventName(): string {
		return 'BgsAppInitEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
