import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { BattlegroundsEvent } from '../events/battlegrounds-event';

export interface EventParser {
	applies(gameEvent: GameEvent | BattlegroundsEvent, state?: BattlegroundsState): boolean;
	parse(
		currentState: BattlegroundsState,
		gameEvent: GameEvent | BattlegroundsEvent,
		appState: MainWindowState,
	): Promise<BattlegroundsState>;
	event(): string;
}
