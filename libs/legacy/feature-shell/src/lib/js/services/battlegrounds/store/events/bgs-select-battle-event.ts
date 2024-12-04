import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsSelectBattleEvent extends BattlegroundsStoreEvent {
	public static readonly eventName = 'BgsSelectBattleEvent' as const;
	constructor(public readonly faceOffId: string) {
		super('BgsSelectBattleEvent');
	}
}
