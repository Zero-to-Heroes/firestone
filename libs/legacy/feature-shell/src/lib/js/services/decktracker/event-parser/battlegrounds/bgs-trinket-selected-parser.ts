import { isBattlegrounds, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsTrinketSelectedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const heroCardId = gameEvent.additionalData.heroCardId;
		const playerId = gameEvent.additionalData.playerId;
		const trinketDbfId = gameEvent.additionalData.trinketDbfId;
		const isFirstTrinket = gameEvent.additionalData.isFirstTrinket;

		console.debug('[bgs-trinket-selected] updating trinkets', gameEvent);
		const playerToUpdate = currentState.bgState.currentGame.findPlayer(playerId);
		if (!playerToUpdate) {
			console.warn(
				'Could not find player to update for trinkets',
				currentState.bgState.currentGame.reviewId,
				heroCardId,
				playerId,
				normalizeHeroCardId(heroCardId, this.allCards),
				currentState.bgState.currentGame.players.map((player) => player.cardId),
				currentState.bgState.currentGame.players.map((player) =>
					normalizeHeroCardId(player.cardId, this.allCards),
				),
			);
			return currentState;
		}

		const lesserTrinket = isFirstTrinket ? this.allCards.getCard(trinketDbfId).id : playerToUpdate.lesserTrinket;
		const greaterTrinket = isFirstTrinket ? playerToUpdate.greaterTrinket : this.allCards.getCard(trinketDbfId).id;
		const newPlayer = playerToUpdate.update({
			lesserTrinket: lesserTrinket,
			greaterTrinket: greaterTrinket,
		});
		const newGame = currentState.bgState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_TRINKET_SELECTED;
	}
}
