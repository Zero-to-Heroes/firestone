import { BgsFaceOffWithSimulation } from '@firestone/battlegrounds/common';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsBattleSimulationUpdateEvent extends BattlegroundsStoreEvent {
	constructor(
		public readonly currentFaceOff: BgsFaceOffWithSimulation,
		public readonly partialUpdate: BgsFaceOffWithSimulation,
	) {
		super('BgsBattleSimulationUpdateEvent');
	}
}
