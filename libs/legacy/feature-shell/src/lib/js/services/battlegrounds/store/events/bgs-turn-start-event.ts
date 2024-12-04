import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsTurnStartEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsTurnStartEvent' as const;
	constructor(public readonly turnNumber: number) {
		super('BgsTurnStartEvent');
	}
}
