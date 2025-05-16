import { GameState } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { OwUtilsService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsRecruitPhaseParser implements EventParser {
	constructor(private readonly owUtils: OwUtilsService, private readonly prefs: PreferencesService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const prefs = await this.prefs.getPreferences();
		if (prefs.flashWindowOnYourTurn) {
			this.owUtils.flashWindow();
		}
		const newGame = currentState.bgState.currentGame.update({
			phase: 'recruit',
		});
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_RECRUIT_PHASE;
	}
}
