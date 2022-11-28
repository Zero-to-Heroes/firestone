import { CurrentAppType } from '../../../../models/mainwindow/current-app.type';
import { MainWindowStoreEvent } from './main-window-store-event';

export class ChangeVisibleApplicationEvent implements MainWindowStoreEvent {
	constructor(public readonly module: CurrentAppType) {}

	public static eventName(): string {
		return 'ChangeVisibleApplicationEvent';
	}

	public eventName(): string {
		return 'ChangeVisibleApplicationEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
