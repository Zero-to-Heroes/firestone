import { MainWindowStoreEvent } from '../main-window-store-event';

export class TriggerSocialNetworkLoginToggleEvent implements MainWindowStoreEvent {
	constructor(network: string) {
		this.network = network;
	}
	readonly network: string;

	public static eventName(): string {
		return 'TriggerSocialNetworkLoginToggleEvent';
	}

	public eventName(): string {
		return 'TriggerSocialNetworkLoginToggleEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
