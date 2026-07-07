/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Aya Lotus Kingpin (JAIL_504)
 * You always go second. Battlecry: Pick an upgraded counterfeit to replace your Coins this game. Get two.
 */
import { AllCardsService, CardIds, CardType } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { GameState } from '../../models/game-state';
import { and, coinExtended, inDeck, inHand, or, side } from '../card-highlight/selectors';
import { GameEvent } from '../game-events/game-event';
import {
	ActionChainParser,
	ChainParsingCard,
	GeneratingCard,
	GuessInfoInput,
	SelectorCard,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';

const COIN_OPTIONS = [CardIds.JadeCoin_JAIL_504t, CardIds.GrimyCoin_JAIL_504t2, CardIds.KabalCoin_JAIL_504t3];

export const AyaLotusKingpin: GeneratingCard & SelectorCard & StaticGeneratingCard & ChainParsingCard = {
	cardIds: [CardIds.AyaLotusKingpin_JAIL_504],
	publicCreator: true,
	overrideDefaultDynamicPool: true,
	chainParser: (allCards: AllCardsService) => new AyaLotusKingpinChainParser(),
	guessInfo: (_input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		possibleCards: _input.card.storedInformation?.targetCardId
			? [_input.card.storedInformation.targetCardId]
			: COIN_OPTIONS,
	}),
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const card = input.inputOptions.deckState.findCard(input.entityId)?.card;
		if (card?.storedInformation?.targetCardId) {
			return [card.storedInformation.targetCardId];
		}
		const cardByCardId = input.inputOptions.deckState
			.getAllCardsInDeckWithoutOptions()
			.find((e) => e.cardId === CardIds.AyaLotusKingpin_JAIL_504);
		if (cardByCardId?.storedInformation?.targetCardId) {
			return [cardByCardId.storedInformation.targetCardId];
		}

		return COIN_OPTIONS;
	},
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), coinExtended),
};

class AyaLotusKingpinChainParser implements ActionChainParser {
	appliesOnEvent(): GameEvent['type'] {
		return GameEvent.CARD_PLAYED;
	}

	async parse(currentState: GameState, events: GameEvent[]): Promise<GameState> {
		const reversedEvents = [...events].reverse();
		const lastEvent = reversedEvents.shift();
		if (lastEvent?.cardId !== CardIds.AyaLotusKingpin_JAIL_504) {
			return currentState;
		}

		const [cardId, controllerId, localPlayer, entityId] = lastEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		if (isPlayer) {
			return currentState;
		}

		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const aya = deck.board.find((e) => e.entityId === entityId);
		if (!aya) {
			return currentState;
		}

		const entityChosenEvent = reversedEvents.find(
			(e) =>
				e.type === GameEvent.ENTITY_CHOSEN &&
				e.additionalData?.context?.creatorCardId === CardIds.AyaLotusKingpin_JAIL_504 &&
				e.additionalData?.context?.creatorEntityId === entityId,
		);
		if (!entityChosenEvent) {
			return currentState;
		}
		const chosenCardId = entityChosenEvent.cardId;
		if (!chosenCardId) {
			return currentState;
		}

		const newAya = aya.update({
			storedInformation: {
				...(aya.storedInformation ?? {}),
				targetCardId: chosenCardId,
			},
		});
		const newBoard = deck.board.map((e) => (e.entityId === entityId ? newAya : e));

		const newDeck = deck.update({ board: newBoard });
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}
}
