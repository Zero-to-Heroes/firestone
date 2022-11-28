import { BgsStatsFilterId } from '../../../../models/battlegrounds/post-match/bgs-stats-filter-id.type';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsPostMatchStatsFilterChangeEvent extends BattlegroundsStoreEvent {
	constructor(public readonly statId: BgsStatsFilterId, public readonly tabIndex: number) {
		super('BgsPostMatchStatsFilterChangeEvent');
	}
}
