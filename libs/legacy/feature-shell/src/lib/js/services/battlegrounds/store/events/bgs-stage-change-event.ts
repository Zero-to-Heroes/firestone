import { BgsPanelId } from '@firestone/game-state';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsStageChangeEvent extends BattlegroundsStoreEvent {
	public static readonly eventName = 'BgsStageChangeEvent' as const;
	constructor(public readonly panelId: BgsPanelId) {
		super('BgsStageChangeEvent');
	}
}
