import { BattlegroundsEvent } from '../../events/battlegrounds-event';

export class BattlegroundsShowPlayerInfoEvent extends BattlegroundsEvent {
	constructor(public readonly playerCardId: string) {
		super('BattlegroundsShowPlayerInfoEvent');
	}
}
