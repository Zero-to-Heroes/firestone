import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsLeaderboardPlaceParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const heroCardId = gameEvent.additionalData.cardId;
		const playerId = gameEvent.additionalData.playerId;
		const leaderboardPlace = gameEvent.additionalData.leaderboardPlace;

		const playerToUpdate = currentState.bgState.currentGame.findPlayer(playerId);
		if (!playerToUpdate) {
			return currentState;
		}
		if (leaderboardPlace === 0) {
			console.error('invalid leaderboard place', gameEvent, currentState.bgState);
		}
		const newPlayer = playerToUpdate.update({
			displayedCardId: heroCardId,
			leaderboardPlace: leaderboardPlace,
		});

		const newGame = currentState.bgState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_LEADERBOARD_PLACE;
	}
}
