import { BattlegroundsEvent } from './battlegrounds-event';

export class BattlegroundsShowHeroInfoEvent extends BattlegroundsEvent {
	constructor(readonly cardId: string) {
		super('BattlegroundsShowHeroInfoEvent');
	}
}
