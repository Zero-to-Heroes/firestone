import { isBaconGhost, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { GameEvents } from '../../../game-events.service';
import { EventParser } from '../event-parser';

export class BgsBuddyGainedParser implements EventParser {
	constructor(private readonly gameEventsService: GameEvents, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const heroCardId = gameEvent.additionalData.cardId;
		const playerId = gameEvent.additionalData.playerId;
		const totalBuddies = gameEvent.additionalData.totalBuddies;

		const playerToUpdate = currentState.bgState.currentGame.findPlayer(playerId);
		if (!playerToUpdate) {
			if (!isBaconGhost(heroCardId)) {
				if (!currentState.reconnectOngoing && !this.gameEventsService.isCatchingUpLogLines()) {
					console.error(
						'No player found to update the buddy',
						currentState.bgState.currentGame.reviewId,
						heroCardId,
						normalizeHeroCardId(heroCardId, this.allCards.getService()),
						currentState.bgState.currentGame.players.map((player) => player.cardId),
					);
				}
			}
			return currentState;
		}

		// Can happen with Aranna getting their new HP - it sends a new Buddy Gained event
		if (totalBuddies === playerToUpdate.buddyTurns.length) {
			return currentState;
		}

		const turn = currentState.getCurrentTurnAdjustedForAsyncPlay();
		const newPlayer = playerToUpdate.update({
			buddyTurns: [...playerToUpdate.buddyTurns, turn],
		});
		const newGame = currentState.bgState.currentGame.updatePlayer(newPlayer);

		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_BUDDY_GAINED;
	}
}
