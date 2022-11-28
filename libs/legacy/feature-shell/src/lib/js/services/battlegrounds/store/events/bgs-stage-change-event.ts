import { BgsPanelId } from '../../../../models/battlegrounds/bgs-panel-id.type';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsStageChangeEvent extends BattlegroundsStoreEvent {
	constructor(public readonly panelId: BgsPanelId) {
		super('BgsStageChangeEvent');
	}
}
