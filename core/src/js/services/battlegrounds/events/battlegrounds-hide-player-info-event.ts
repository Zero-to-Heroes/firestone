import { BattlegroundsEvent } from './battlegrounds-event';

export class BattlegroundsHidePlayerInfoEvent extends BattlegroundsEvent {
	constructor() {
		super('BattlegroundsHidePlayerInfoEvent');
	}
}
