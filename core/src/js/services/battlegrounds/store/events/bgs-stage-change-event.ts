import { BgsStageId } from '../../../../models/battlegrounds/bgs-stage-id.type';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsStageChangeEvent extends BattlegroundsStoreEvent {
	constructor(public readonly stage: BgsStageId) {
		super('BgsStageChangeEvent');
	}
}
