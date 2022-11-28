import { GameSettingsEvent } from '../../../../models/mainwindow/game-events/game-settings-event';
import { BattlegroundsStoreEvent } from './_battlegrounds-store-event';

export class BgsGameSettingsEvent extends BattlegroundsStoreEvent {
	constructor(public readonly event: GameSettingsEvent) {
		super('BgsGameSettingsEvent');
	}
}
