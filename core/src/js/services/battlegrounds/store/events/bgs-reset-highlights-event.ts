import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsResetHighlightsEvent extends BattlegroundsStoreEvent {
	constructor() {
		super('BgsResetHighlightsEvent');
	}
}
