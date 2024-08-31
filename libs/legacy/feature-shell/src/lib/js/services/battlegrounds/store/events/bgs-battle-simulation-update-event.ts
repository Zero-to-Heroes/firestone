import { BgsFaceOffWithSimulation } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsBattleSimulationUpdateEvent extends BattlegroundsStoreEvent {
	constructor(
		public readonly currentFaceOff: BgsFaceOffWithSimulation,
		public readonly partialUpdate: BgsFaceOffWithSimulation,
	) {
		super('BgsBattleSimulationUpdateEvent');
	}
}
