import { isBattlegrounds, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsTriple, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsTripleParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const heroCardId = gameEvent.cardId;
		const playerId = gameEvent.additionalData.playerId;

		const playerToUpdate = currentState.bgState.currentGame.findPlayer(playerId);
		if (!playerToUpdate) {
			console.warn(
				'Could not find player to update for triple history',
				currentState.bgState.currentGame.reviewId,
				heroCardId,
				normalizeHeroCardId(heroCardId, this.allCards),
				currentState.bgState.currentGame.players.map((player) => player.cardId),
				currentState.bgState.currentGame.players.map((player) =>
					normalizeHeroCardId(player.cardId, this.allCards),
				),
			);
			return currentState;
		}
		const newHistory: readonly BgsTriple[] = [
			...playerToUpdate.tripleHistory,
			BgsTriple.create({
				tierOfTripledMinion: playerToUpdate.getCurrentTavernTier(),
				turn: currentState.currentTurnNumeric,
			}),
		];
		const newPlayer = playerToUpdate.update({
			tripleHistory: newHistory,
		});
		const newGame = currentState.bgState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_TRIPLE;
	}
}
