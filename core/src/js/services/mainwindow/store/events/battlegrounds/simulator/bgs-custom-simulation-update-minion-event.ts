import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { MainWindowStoreEvent } from '../../main-window-store-event';

export class BgsCustomSimulationUpdateMinionEvent implements MainWindowStoreEvent {
	constructor(
		public readonly side: 'player' | 'opponent',
		public readonly index: number,
		public readonly entity: BoardEntity,
	) {}

	public static eventName(): string {
		return 'BgsCustomSimulationUpdateMinionEvent';
	}

	public eventName(): string {
		return 'BgsCustomSimulationUpdateMinionEvent';
	}

	public isNavigationEvent(): boolean {
		return false;
	}
}
