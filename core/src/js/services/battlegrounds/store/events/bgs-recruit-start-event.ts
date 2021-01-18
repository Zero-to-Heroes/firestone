import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsRecruitStartEvent extends BattlegroundsStoreEvent {
	constructor() {
		super('BgsRecruitStartEvent');
	}
}
