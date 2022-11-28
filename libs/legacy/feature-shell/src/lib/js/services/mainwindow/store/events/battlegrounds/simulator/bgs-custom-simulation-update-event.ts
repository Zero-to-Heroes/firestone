import { BgsFaceOffWithSimulation } from '../../../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { MainWindowStoreEvent } from '../../main-window-store-event';

export class BgsCustomSimulationUpdateEvent implements MainWindowStoreEvent {
	constructor(
		public readonly currentFaceOff: BgsFaceOffWithSimulation,
		public readonly partialUpdate: BgsFaceOffWithSimulation,
	) {}

	public static eventName(): string {
		return 'BgsCustomSimulationUpdateEvent';
	}

	public eventName(): string {
		return 'BgsCustomSimulationUpdateEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
