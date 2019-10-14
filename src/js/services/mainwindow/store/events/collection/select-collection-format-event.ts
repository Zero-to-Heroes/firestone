import { MainWindowStoreEvent } from '../main-window-store-event';

export class SelectCollectionFormatEvent implements MainWindowStoreEvent {
	constructor(format: string) {
		this.format = format;
	}
	readonly format: string;

	public static eventName(): string {
		return 'SelectCollectionFormatEvent';
	}

	public eventName(): string {
		return 'SelectCollectionFormatEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
