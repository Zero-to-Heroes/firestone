import { GameStats } from '../../../../models/mainwindow/stats/game-stats';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsStatUpdateEvent extends BattlegroundsStoreEvent {
	constructor(public readonly newGameStats: GameStats) {
		super('BgsStatUpdateEvent');
	}
}
