import { CardIds, defaultStartingHp, GameType, getHeroPower, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsOpponentRevealedEvent } from '../events/bgs-opponent-revealed-event';
import { EventParser } from './_event-parser';

export class BgsOpponentRevealedParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsOpponentRevealedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsOpponentRevealedEvent): Promise<BattlegroundsState> {
		// console.log(
		// 	'opponent revealed',
		// 	event.cardId,
		// 	currentState?.currentGame?.players?.map((player) => player.cardId),
		// );
		const normalizedCardId = normalizeHeroCardId(event.cardId, this.allCards.getService());
		if (normalizedCardId === CardIds.Kelthuzad_TB_BaconShop_HERO_KelThuzad) {
			return currentState;
		}

		const existingPlayer = currentState.currentGame.players.find(
			(player) => normalizeHeroCardId(player.cardId, this.allCards.getService()) === normalizedCardId,
		);
		const newPlayer =
			existingPlayer != null
				? existingPlayer
				: BgsPlayer.create({
						cardId: normalizedCardId,
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
				...currentState.currentGame.players.filter(
					(player) => normalizeHeroCardId(player.cardId, this.allCards.getService()) !== normalizedCardId,
				),
				updatedPlayer,
			] as readonly BgsPlayer[],
		} as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
