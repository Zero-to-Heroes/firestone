import { MainWindowStoreEvent } from '../../main-window-store-event';

export class BgsSimulatorMinionTierFilterSelectedEvent implements MainWindowStoreEvent {
	constructor(public readonly tier: 'all' | '1' | '2' | '3' | '4' | '5' | '6') {}

	public static eventName(): string {
		return 'BgsSimulatorMinionTierFilterSelectedEvent';
	}

	public eventName(): string {
		return 'BgsSimulatorMinionTierFilterSelectedEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
