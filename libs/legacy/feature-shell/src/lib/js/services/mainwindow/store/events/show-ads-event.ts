import { MainWindowStoreEvent } from './main-window-store-event';

export class ShowAdsEvent implements MainWindowStoreEvent {
	public static eventName(): string {
		return 'ShowAdsEvent';
	}

	constructor(public readonly showAds: boolean) {}

	public eventName(): string {
		return 'ShowAdsEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
