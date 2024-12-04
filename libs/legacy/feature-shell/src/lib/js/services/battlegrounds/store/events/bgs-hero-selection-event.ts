import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsHeroSelectionEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsHeroSelectionEvent' as const;
	constructor(public readonly options: readonly { cardId: string; entityId: number }[]) {
		super('BgsHeroSelectionEvent');
	}
}
