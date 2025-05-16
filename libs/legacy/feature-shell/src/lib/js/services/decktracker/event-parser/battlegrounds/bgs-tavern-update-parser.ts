import { isBaconGhost, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsTavernUpgrade, BgsTriple, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { GameEvents } from '../../../game-events.service';
import { EventParser } from '../event-parser';

export class BgsTavernUpdateParser implements EventParser {
	constructor(private readonly gameEventsService: GameEvents, private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const heroCardId = gameEvent.additionalData.cardId;
		const playerId = gameEvent.additionalData.playerId;
		const tavernTier = gameEvent.additionalData.tavernLevel;

		const playerToUpdate = currentState.bgState.currentGame.findPlayer(playerId);
		if (!playerToUpdate) {
			if (!isBaconGhost(heroCardId)) {
				if (!currentState.reconnectOngoing && !this.gameEventsService.isCatchingUpLogLines()) {
					console.warn(
						'No player found to update the history',
						currentState.bgState.currentGame.reviewId,
						heroCardId,
						normalizeHeroCardId(heroCardId, this.allCards),
						currentState.bgState.currentGame.players.map((player) => player.cardId),
					);
				}
			}
			return currentState;
		}

		const turn = currentState.getCurrentTurnAdjustedForAsyncPlay();
		const newHistory: readonly BgsTavernUpgrade[] = [
			...playerToUpdate.tavernUpgradeHistory,
			BgsTavernUpgrade.create({
				tavernTier: tavernTier,
				turn: turn,
			}),
		];
		// If the upgrade happens after a triple has been done on the same turn, it's very likely that they
		// dioscovered the triple once the upgrade occured, so we adjust the tavern tier
		const newTripleHistory: readonly BgsTriple[] = playerToUpdate.tripleHistory.map((triple) => {
			if (triple.turn === turn) {
				return {
					tierOfTripledMinion: triple.tierOfTripledMinion + 1,
					cardId: triple.cardId,
					turn: triple.turn,
				};
			} else {
				return triple;
			}
		});
		const newPlayer = playerToUpdate.update({
			tavernUpgradeHistory: newHistory,
			tripleHistory: newTripleHistory,
		});
		const newGame = currentState.bgState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_TAVERN_UPGRADE;
	}
}
