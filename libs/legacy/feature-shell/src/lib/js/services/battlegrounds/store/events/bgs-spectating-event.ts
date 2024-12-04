import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsSpectatingEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsSpectatingEvent' as const;
	constructor(public readonly isSpectating: boolean) {
		super('BgsSpectatingEvent');
	}
}
