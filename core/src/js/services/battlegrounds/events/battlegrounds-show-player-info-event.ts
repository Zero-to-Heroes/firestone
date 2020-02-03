import { BattlegroundsEvent } from './battlegrounds-event';

export class BattlegroundsShowPlayerInfoEvent extends BattlegroundsEvent {
	constructor(readonly playerCardId: string) {
		super('BattlegroundsShowPlayerInfoEvent');
	}
}
