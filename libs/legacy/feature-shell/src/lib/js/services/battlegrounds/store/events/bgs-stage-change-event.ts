import { BgsPanelId } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsStageChangeEvent extends BattlegroundsStoreEvent {
	constructor(public readonly panelId: BgsPanelId) {
		super('BgsStageChangeEvent');
	}
}
