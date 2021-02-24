import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsChangePostMatchStatsTabsNumberEvent extends BattlegroundsStoreEvent {
	constructor(public readonly tabsNumber: number) {
		super('BgsChangePostMatchStatsTabsNumberEvent');
	}
}
