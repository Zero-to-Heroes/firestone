import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsHeroSelectionEvent extends BattlegroundsStoreEvent {
	constructor(public readonly options: readonly { cardId: string; entityId: number }[]) {
		super('BgsHeroSelectionEvent');
	}
}
