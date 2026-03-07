import { MainWindowStoreEvent } from '../main-window-store-event';

export class ShareVideoOnSocialNetworkEvent implements MainWindowStoreEvent {
	constructor(network: string, videoPathOnDisk: string, message: string) {
		this.network = network;
		this.videoPathOnDisk = videoPathOnDisk;
		this.message = message;
	}
	readonly network: string;
	readonly videoPathOnDisk: string;
	readonly message: string;

	public static eventName(): string {
		return 'ShareVideoOnSocialNetworkEvent';
	}

	public eventName(): string {
		return 'ShareVideoOnSocialNetworkEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}

	public isResetHistoryEvent(): boolean {
		return false;
	}
}
