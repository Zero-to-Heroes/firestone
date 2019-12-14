import { BattlegroundsHero } from '../../../models/battlegrounds/battlegrounds-hero';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../models/game-event';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { EventParser } from './event-parser';

export class BattlegroundsHideHeroSelectionParser implements EventParser {
	constructor() {}

	public applies(gameEvent: GameEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === GameEvent.MULLIGAN_DONE;
	}

	public async parse(
		currentState: BattlegroundsState,
		event: GameEvent,
		appState: MainWindowState,
	): Promise<BattlegroundsState> {
		return currentState.update({
			heroSelection: [] as readonly BattlegroundsHero[],
		} as BattlegroundsState);
	}

	public event() {
		return GameEvent.MULLIGAN_DONE;
	}
}
