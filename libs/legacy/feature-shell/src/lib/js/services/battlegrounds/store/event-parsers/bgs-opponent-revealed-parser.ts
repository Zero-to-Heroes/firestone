import {
	defaultStartingHp,
	GameType,
	getHeroPower,
	isBaconGhost,
	normalizeHeroCardId,
} from '@firestone-hs/reference-data';
import { BattlegroundsState, BgsGame, BgsPlayer } from '@firestone/battlegrounds/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsOpponentRevealedEvent } from '../events/bgs-opponent-revealed-event';
import { EventParser } from './_event-parser';

export class BgsOpponentRevealedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsOpponentRevealedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsOpponentRevealedEvent): Promise<BattlegroundsState> {
		// console.debug(
		// 	'opponent revealed',
		// 	event.cardId,
		// 	currentState?.currentGame?.players?.map((player) => player.cardId),
		// );
		const normalizedCardId = normalizeHeroCardId(event.cardId, this.allCards.getService());
		if (isBaconGhost(normalizedCardId)) {
			return currentState;
		}

		const existingPlayer = currentState.currentGame.findPlayer(event.playerId);
		const newPlayer =
			existingPlayer != null
				? existingPlayer
				: BgsPlayer.create({
						cardId: normalizedCardId,
						playerId: event.playerId,
						heroPowerCardId: getHeroPower(event.cardId, this.allCards.getService()),
						name: this.allCards.getCard(event.cardId).name,
						initialHealth: defaultStartingHp(GameType.GT_BATTLEGROUNDS, normalizedCardId, this.allCards),
				  } as BgsPlayer);
		const updatedPlayer = newPlayer.update({
			leaderboardPlace: event.leaderboardPlace === -1 ? null : event.leaderboardPlace,
			currentArmor: event.armor,
			initialHealth: event.health,
		});
		const newGame = currentState.currentGame.update({
			players: [
				...currentState.currentGame.players.filter((player) => player.playerId !== event.playerId),
				updatedPlayer,
			] as readonly BgsPlayer[],
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
