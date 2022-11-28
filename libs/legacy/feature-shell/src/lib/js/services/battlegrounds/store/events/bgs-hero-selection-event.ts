import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsHeroSelectionEvent extends BattlegroundsStoreEvent {
	constructor(public readonly heroCardIds: readonly string[]) {
		super('BgsHeroSelectionEvent');
	}
}
