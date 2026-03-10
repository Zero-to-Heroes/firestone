import { BgsFaceOffWithSimulation } from '@firestone/game-state';
import { MainWindowStoreEvent } from '../main-window-store-event';

export class BattlegroundsMainWindowSelectBattleEvent implements MainWindowStoreEvent {
	
	readonly eventName = BattlegroundsMainWindowSelectBattleEvent.eventName

	constructor(public readonly faceOff: BgsFaceOffWithSimulation) {}

	static readonly eventName = 'BattlegroundsMainWindowSelectBattleEvent'
}
