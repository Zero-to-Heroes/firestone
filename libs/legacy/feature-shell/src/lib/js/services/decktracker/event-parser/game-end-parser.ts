import { OwUtilsService } from '@legacy-import/src/lib/js/services/plugins/ow-utils.service';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { PreferencesService } from '../../preferences.service';
import { EventParser } from './event-parser';

export class GameEndParser implements EventParser {
	constructor(private readonly prefs: PreferencesService, private readonly owUtils: OwUtilsService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return (
			!!state &&
			(gameEvent.type === GameEvent.GAME_END ||
				// When we stop spectating, we trigger the game end actions
				(gameEvent.type === GameEvent.SPECTATING && state.spectating && !gameEvent.additionalData.spectating))
		);
	}

	async parse(currentState: GameState): Promise<GameState> {
		const prefs = await this.prefs.getPreferences();
		if (prefs.flashWindowOnYourTurn) {
			this.owUtils.flashWindow();
		}
		if (prefs && prefs.decktrackerCloseOnGameEnd) {
			return GameState.create({
				gameEnded: true,
			});
		}
		return currentState.update({
			gameEnded: true,
		} as GameState);
	}

	event(): string {
		return GameEvent.GAME_END;
	}
}
