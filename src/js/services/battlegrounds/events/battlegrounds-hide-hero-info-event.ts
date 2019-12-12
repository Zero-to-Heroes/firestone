import { BattlegroundsEvent } from './battlegrounds-event';

export class BattlegroundsHideHeroInfoEvent extends BattlegroundsEvent {
	constructor() {
		super('BattlegroundsHideHeroInfoEvent');
	}
}
