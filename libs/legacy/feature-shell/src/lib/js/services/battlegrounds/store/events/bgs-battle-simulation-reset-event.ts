import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsBattleSimulationResetEvent extends BattlegroundsStoreEvent {
	public static readonly eventName = 'BgsBattleSimulationResetEvent' as const;
	constructor(public readonly faceOffId: string) {
		super('BgsBattleSimulationResetEvent');
	}
}
