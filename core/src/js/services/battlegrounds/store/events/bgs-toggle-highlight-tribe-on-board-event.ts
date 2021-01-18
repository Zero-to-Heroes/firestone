import { Race } from '@firestone-hs/reference-data';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsToggleHighlightTribeOnBoardEvent extends BattlegroundsStoreEvent {
	constructor(public readonly tribe: Race) {
		super('BgsToggleHighlightTribeOnBoardEvent');
	}
}
