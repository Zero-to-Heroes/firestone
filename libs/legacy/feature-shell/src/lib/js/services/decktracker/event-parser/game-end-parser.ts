import { GameState } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { OwUtilsService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
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
		// if (prefs && prefs.decktrackerCloseOnGameEnd) {
		// 	return GameState.create({
		// 		gameEnded: true,
		// 	});
		// }
		return currentState.update({
			gameEnded: true,
			bgState: currentState.bgState.update({
				currentGame: currentState.bgState.currentGame?.update({
					// Not sure exactly why that is needed, maybe we can remove it once all the bugs are fixed
					phase: 'recruit',
				}),
				duoPendingBoards: [],
				playerTeams: null,
			}),
		});
	}

	event(): string {
		return GameEvent.GAME_END;
	}
}
