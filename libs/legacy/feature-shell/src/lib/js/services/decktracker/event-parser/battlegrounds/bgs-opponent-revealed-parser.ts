import {
	defaultStartingHp,
	GameType,
	getHeroPower,
	isBaconGhost,
	normalizeHeroCardId,
} from '@firestone-hs/reference-data';
import { BgsPlayer, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@legacy-import/src/lib/js/models/game-event';
import { EventParser } from '../event-parser';

export class BgsOpponentRevealedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const cardId = gameEvent.additionalData.cardId;
		const playerId = gameEvent.additionalData.playerId;
		const leaderboardPlace = gameEvent.additionalData.leaderboardPlace;
		const health = gameEvent.additionalData.health;
		const armor = gameEvent.additionalData.armor;
		const normalizedCardId = normalizeHeroCardId(cardId, this.allCards.getService());
		if (isBaconGhost(normalizedCardId)) {
			return currentState;
		}

		const existingPlayer = currentState.bgState.currentGame.findPlayer(playerId);
		const newPlayer =
			existingPlayer != null
				? existingPlayer
				: BgsPlayer.create({
						cardId: normalizedCardId,
						playerId: playerId,
						heroPowerCardId: getHeroPower(cardId, this.allCards.getService()),
						name: this.allCards.getCard(cardId).name,
						initialHealth: defaultStartingHp(GameType.GT_BATTLEGROUNDS, normalizedCardId, this.allCards),
				  } as BgsPlayer);
		const updatedPlayer = newPlayer.update({
			leaderboardPlace: leaderboardPlace === -1 ? null : leaderboardPlace,
			currentArmor: armor,
			initialHealth: health,
		});
		const newGame = currentState.bgState.currentGame.update({
			players: [
				...currentState.bgState.currentGame.players.filter((player) => player.playerId !== playerId),
				updatedPlayer,
			] as readonly BgsPlayer[],
		});
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_OPPONENT_REVEALED;
	}
}
