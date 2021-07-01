import { MainWindowStoreEvent } from '../../main-window-store-event';

export class BgsCustomSimulationUpdateMinionRequestEvent implements MainWindowStoreEvent {
	constructor(public readonly side: 'player' | 'opponent', public readonly index?: number) {}

	public static eventName(): string {
		return 'BgsCustomSimulationUpdateMinionRequestEvent';
	}

	public eventName(): string {
		return 'BgsCustomSimulationUpdateMinionRequestEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
