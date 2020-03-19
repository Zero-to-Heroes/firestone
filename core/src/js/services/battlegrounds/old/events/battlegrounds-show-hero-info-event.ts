import { BattlegroundsEvent } from '../../events/battlegrounds-event';

export class BattlegroundsShowHeroInfoEvent extends BattlegroundsEvent {
	constructor(public readonly cardId: string) {
		super('BattlegroundsShowHeroInfoEvent');
	}
}
