import { GameSettingsEvent } from '../../../../models/mainwindow/game-events/game-settings-event';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsGameSettingsEvent extends BattlegroundsStoreEvent {
	public static eventName = 'BgsGameSettingsEvent' as const;
	constructor(public readonly event: GameSettingsEvent) {
		super('BgsGameSettingsEvent');
	}
}
