import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsGameEndEvent extends BattlegroundsStoreEvent {
	constructor(public readonly replayXml: string) {
		super('BgsGameEndEvent');
	}
}
