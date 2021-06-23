import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsSpectatingEvent extends BattlegroundsStoreEvent {
	constructor(public readonly isSpectating: boolean) {
		super('BgsSpectatingEvent');
	}
}
