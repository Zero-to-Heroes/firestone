import { BgsFaceOffWithSimulation } from '@firestone/game-state';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsBattleSimulationUpdateEvent extends BattlegroundsStoreEvent {
	public static readonly eventName = 'BgsBattleSimulationUpdateEvent' as const;
	constructor(
		public readonly currentFaceOff: BgsFaceOffWithSimulation,
		public readonly partialUpdate: BgsFaceOffWithSimulation,
	) {
		super('BgsBattleSimulationUpdateEvent');
	}
}
