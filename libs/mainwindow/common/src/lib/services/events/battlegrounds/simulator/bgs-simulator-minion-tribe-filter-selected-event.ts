import { MainWindowStoreEvent } from '../../main-window-store-event';

export class BgsSimulatorMinionTribeFilterSelectedEvent implements MainWindowStoreEvent {
	
	readonly eventName = BgsSimulatorMinionTribeFilterSelectedEvent.eventName

	constructor(public readonly tribe: string) {}

	static readonly eventName = 'BgsSimulatorMinionTribeFilterSelectedEvent'
}
