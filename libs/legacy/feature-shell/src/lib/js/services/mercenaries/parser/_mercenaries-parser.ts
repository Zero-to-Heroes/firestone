import { GameEvent } from '@firestone/game-state';
import { MainWindowState } from '@firestone/mainwindow/common';
import { MercenariesBattleState } from '../../../models/mercenaries/mercenaries-battle-state';

export interface MercenariesParser {
	eventType(): string;
	applies(battleState: MercenariesBattleState): boolean;
	parse(
		battleState: MercenariesBattleState,
		event: GameEvent,
		mainWindowState: MainWindowState,
	): Promise<MercenariesBattleState>;
}
