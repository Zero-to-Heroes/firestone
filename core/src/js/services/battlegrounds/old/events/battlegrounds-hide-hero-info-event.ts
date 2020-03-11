import { BattlegroundsEvent } from '../../events/battlegrounds-event';

export class BattlegroundsHideHeroInfoEvent extends BattlegroundsEvent {
	constructor() {
		super('BattlegroundsHideHeroInfoEvent');
	}
}
