import { BgsPanelId } from '@firestone/battlegrounds/common';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsStageChangeEvent extends BattlegroundsStoreEvent {
	constructor(public readonly panelId: BgsPanelId) {
		super('BgsStageChangeEvent');
	}
}
