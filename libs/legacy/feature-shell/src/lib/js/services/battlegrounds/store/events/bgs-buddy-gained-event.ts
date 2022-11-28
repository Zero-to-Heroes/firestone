import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsBuddyGainedEvent extends BattlegroundsStoreEvent {
	constructor(public readonly heroCardId: string, public readonly totalBuddies: number) {
		super('BgsBuddyGainedEvent');
	}
}
