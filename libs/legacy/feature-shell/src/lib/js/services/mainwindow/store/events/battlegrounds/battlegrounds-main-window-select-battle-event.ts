import { BgsFaceOffWithSimulation } from '@firestone/game-state';
import { MainWindowStoreEvent } from '@firestone/mainwindow/common';

export class BattlegroundsMainWindowSelectBattleEvent implements MainWindowStoreEvent {
	constructor(public readonly faceOff: BgsFaceOffWithSimulation) {}

	public static eventName(): string {
		return 'BattlegroundsMainWindowSelectBattleEvent';
	}

	public eventName(): string {
		return 'BattlegroundsMainWindowSelectBattleEvent';
	}

	public isNavigationEvent(): boolean {
		return true;
	}
}
