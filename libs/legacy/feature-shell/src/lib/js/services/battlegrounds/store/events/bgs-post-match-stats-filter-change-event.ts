import { BgsStatsFilterId } from '@firestone/battlegrounds/core';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsPostMatchStatsFilterChangeEvent extends BattlegroundsStoreEvent {
	public static readonly eventName = 'BgsPostMatchStatsFilterChangeEvent' as const;
	constructor(public readonly statId: BgsStatsFilterId, public readonly tabIndex: number) {
		super('BgsPostMatchStatsFilterChangeEvent');
	}
}
