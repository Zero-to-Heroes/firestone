import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsRecruitStartEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsRecruitStartEvent' as const;
	constructor() {
		super('BgsRecruitStartEvent');
	}
}
