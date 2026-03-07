import { MainWindowStoreEvent } from '../../main-window-store-event';

export class BgsSimulatorMinionTribeFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly tribe: string) {}

	public static eventName(): string {
		return 'BgsSimulatorMinionTribeFilterSelectedEvent';
	}

	public eventName(): string {
		return 'BgsSimulatorMinionTribeFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
