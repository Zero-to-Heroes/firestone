import { BattlegroundsEvent } from '../../events/battlegrounds-event';

export class BattlegroundsShowHeroInfoEvent extends BattlegroundsEvent {
	constructor(readonly cardId: string) {
		super('BattlegroundsShowHeroInfoEvent');
	}
}
