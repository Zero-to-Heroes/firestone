import { GameTag } from '@firestone-hs/reference-data';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsToggleHighlightMechanicsOnBoardEvent extends BattlegroundsStoreEvent {
	constructor(public readonly mechanics: GameTag) {
		super('BgsToggleHighlightMechanicsOnBoardEvent');
	}
}
