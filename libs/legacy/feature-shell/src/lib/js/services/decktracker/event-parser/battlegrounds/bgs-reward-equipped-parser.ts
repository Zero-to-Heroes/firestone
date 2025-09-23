import { isBattlegrounds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '@firestone/game-state';
import { LocalizationFacadeService } from '../../../localization-facade.service';
import { EventParser } from '../event-parser';

export class BgsRewardEquippedParser implements EventParser {
	constructor(
		private readonly cards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = this.cards.getCard(cardId);
		const rewardCard = DeckCard.create({
			cardId: dbCard.id,
			entityId: entityId,
			cardName: dbCard.name,
			refManaCost: dbCard.cost,
			rarity: dbCard.rarity,
			zone: 'PLAY',
			temporaryCard: false,
			playTiming: GameState.playTiming++,
		} as DeckCard);
		if (!rewardCard) {
			console.warn('[bgs-reward-gained] missing reward', gameEvent);
			return currentState;
		}

		const newPlayerDeck = deck.update({
			weapon: gameEvent.additionalData.isHeroPowerReward ? deck.weapon : rewardCard,
			heroPower: gameEvent.additionalData.isHeroPowerReward ? rewardCard : deck.heroPower,
		} as DeckState);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.BATTLEGROUNDS_QUEST_REWARD_EQUIPPED;
	}
}
