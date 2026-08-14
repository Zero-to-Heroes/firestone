/* eslint-disable no-mixed-spaces-and-tabs */
// Forbidden Shrine (EDR_520): 1 Mana Location
// "Spend all your Mana. Cast a random spell that costs that much."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const shrineCost = (manaLeft: number | undefined, cardCost: number | undefined) =>
	Math.min(10, Math.max(0, (manaLeft ?? 0) - (cardCost ?? 0)));

export const ForbiddenShrine: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ForbiddenShrine_EDR_520],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const cost = shrineCost(input.inputOptions.deckState.manaLeft, input.allCards.getCard(input.cardId)?.cost);
		return filterCards(
			ForbiddenShrine.cardIds[0],
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', cost),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const cost = shrineCost(input.deckState.manaLeft, input.allCards.getCard(ForbiddenShrine.cardIds[0])?.cost);
		return {
			cardType: CardType.SPELL,
			cost,
			possibleCards: filterCards(
				ForbiddenShrine.cardIds[0],
				input.allCards,
				(c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '==', cost),
				input.options,
			),
		};
	},
};
