import { BattlegroundsEvent } from '../../events/battlegrounds-event';

export class BattlegroundsHidePlayerInfoEvent extends BattlegroundsEvent {
	constructor() {
		super('BattlegroundsHidePlayerInfoEvent');
	}
}
