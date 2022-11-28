import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { MainWindowStoreEvent } from './main-window-store-event';

export class StoreInitEvent implements MainWindowStoreEvent {
	constructor(public readonly initialState: MainWindowState, public readonly storeReady: boolean) {}

	public static eventName(): string {
		return 'StoreInitEvent';
	}

	public eventName(): string {
		return 'StoreInitEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
