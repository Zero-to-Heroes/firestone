import { BgsPostMatchStats } from '../../../../models/battlegrounds/post-match/bgs-post-match-stats';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsGameEndEvent extends BattlegroundsStoreEvent {
	constructor(public readonly postMatchStats: BgsPostMatchStats) {
		super('BgsGameEndEvent');
	}
}
