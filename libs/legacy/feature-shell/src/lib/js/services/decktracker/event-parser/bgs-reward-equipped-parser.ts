import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { EventParser } from './event-parser';

export class BgsRewardEquippedParser implements EventParser {
	constructor(private readonly cards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.BATTLEGROUNDS_QUEST_REWARD_EQUIPPED;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const dbCard = this.cards.getCard(cardId);
		const rewardCard = DeckCard.create({
			cardId: dbCard.id,
			entityId: entityId,
			cardName: this.i18n.getCardName(dbCard.id),
			manaCost: dbCard.cost,
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
