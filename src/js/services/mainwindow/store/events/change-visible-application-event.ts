import { MainWindowStoreEvent } from './main-window-store-event';

export class ChangeVisibleApplicationEvent implements MainWindowStoreEvent {
	constructor(module: string) {
		this.module = module;
	}
	readonly module: string;

	public static eventName(): string {
		return 'ChangeVisibleApplicationEvent';
	}

	public eventName(): string {
		return 'ChangeVisibleApplicationEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
