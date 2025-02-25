import { CurrentAppType } from '@firestone/shared/common/service';
import { MainWindowStoreEvent } from './main-window-store-event';

export class ChangeVisibleApplicationEvent implements MainWindowStoreEvent {
	constructor(public readonly module: CurrentAppType, public readonly forceApplicationVisible = false) {}

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
