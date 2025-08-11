import { GameState } from '../../../models/game-state';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';

export class GameSettingsParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		console.debug('updating game settings', gameEvent.additionalData);
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: currentState.bgState.currentGame?.update({
					hasPrizes: gameEvent.additionalData.battlegroundsPrizes,
					hasQuests: gameEvent.additionalData.battlegroundsQuests,
					hasBuddies: gameEvent.additionalData.battlegroundsBuddies,
					hasSpells: gameEvent.additionalData.battlegroundsSpells,
					anomalies: gameEvent.additionalData.battlegroundsAnomalies,
					hasTrinkets: gameEvent.additionalData.battlegroundsTrinkets,
					hasTimewarped: gameEvent.additionalData.battlegroundsTimewarped,
				}),
			}),
		});
	}

	event(): string {
		return GameEvent.GAME_SETTINGS;
	}
}
