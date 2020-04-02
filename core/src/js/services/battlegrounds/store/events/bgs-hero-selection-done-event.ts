import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsHeroSelectionDoneEvent extends BattlegroundsStoreEvent {
	constructor() {
		super('BgsHeroSelectionDoneEvent');
	}
}
