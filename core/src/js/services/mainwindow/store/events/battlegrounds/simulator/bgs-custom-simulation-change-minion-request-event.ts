import { MainWindowStoreEvent } from '../../main-window-store-event';

export class BgsCustomSimulationChangeMinionRequestEvent implements MainWindowStoreEvent {
	constructor(public readonly side: 'player' | 'opponent', public readonly index?: number) {}

	public static eventName(): string {
		return 'BgsCustomSimulationChangeMinionRequestEvent';
	}

	public eventName(): string {
		return 'BgsCustomSimulationChangeMinionRequestEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
