import { MainWindowStoreEvent } from '../../main-window-store-event';

export class BgsCustomSimulationResetEvent implements MainWindowStoreEvent {
	constructor(public readonly faceOffId: string) {}

	public static eventName(): string {
		return 'BgsCustomSimulationResetEvent';
	}

	public eventName(): string {
		return 'BgsCustomSimulationResetEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
