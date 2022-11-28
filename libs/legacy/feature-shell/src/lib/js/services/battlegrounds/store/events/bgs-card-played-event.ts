import { GameEvent } from '../../../../models/game-event';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsCardPlayedEvent extends BattlegroundsStoreEvent {
	constructor(public readonly gameEvent: GameEvent) {
		super('BgsCardPlayedEvent');
	}
}
