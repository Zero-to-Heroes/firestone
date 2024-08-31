import { BgsFaceOffWithSimulation } from '@firestone/battlegrounds/core';
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
