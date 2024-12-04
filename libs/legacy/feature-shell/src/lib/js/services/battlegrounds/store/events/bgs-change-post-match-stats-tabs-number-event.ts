import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsChangePostMatchStatsTabsNumberEvent extends BattlegroundsStoreEvent {
	public static readonly eventName = 'BgsChangePostMatchStatsTabsNumberEvent' as const;
	constructor(public readonly tabsNumber: number) {
		super('BgsChangePostMatchStatsTabsNumberEvent');
	}
}
