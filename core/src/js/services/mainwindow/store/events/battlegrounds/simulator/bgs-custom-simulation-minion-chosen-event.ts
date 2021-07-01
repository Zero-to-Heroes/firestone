import { MainWindowStoreEvent } from '../../main-window-store-event';

export class BgsCustomSimulationMinionChosenEvent implements MainWindowStoreEvent {
	constructor(
		public readonly cardId: string,
		public readonly side: 'player' | 'opponent',
		public readonly minionIndex: number,
	) {}

	public static eventName(): string {
		return 'BgsCustomSimulationMinionChosenEvent';
	}

	public eventName(): string {
		return 'BgsCustomSimulationMinionChosenEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
