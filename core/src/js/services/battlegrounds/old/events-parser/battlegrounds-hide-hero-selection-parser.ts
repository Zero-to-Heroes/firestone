import { BattlegroundsHero } from '../../../../models/battlegrounds/old/battlegrounds-hero';
import { BattlegroundsState } from '../../../../models/battlegrounds/old/battlegrounds-state';
import { GameEvent } from '../../../../models/game-event';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { EventParser } from '../../events-parser/event-parser';

export class BattlegroundsHideHeroSelectionParser implements EventParser {
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
