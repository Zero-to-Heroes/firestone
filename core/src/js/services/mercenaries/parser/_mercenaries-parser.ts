import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';

export interface MercenariesParser {
	eventType(): string;
	applies(battleState: MercenariesBattleState): boolean;
	parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): MercenariesBattleState | PromiseLike<MercenariesBattleState>;
}
