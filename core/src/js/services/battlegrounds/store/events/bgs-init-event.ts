import { BgsStats } from '../../../../models/battlegrounds/stats/bgs-stats';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsInitEvent extends BattlegroundsStoreEvent {
	constructor(public readonly matchStats: readonly GameStat[], public readonly bgsGlobalStats: BgsStats) {
		super('BgsInitEvent');
	}
}
