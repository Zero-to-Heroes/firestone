import { MainWindowStoreEvent } from '../../main-window-store-event';

export class BgsCustomSimulationMinionRemoveRequestEvent implements MainWindowStoreEvent {
	constructor(public readonly side: 'player' | 'opponent', public readonly minionIndex: number) {}

	public static eventName(): string {
		return 'BgsCustomSimulationMinionRemoveRequestEvent';
	}

	public eventName(): string {
		return 'BgsCustomSimulationMinionRemoveRequestEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
