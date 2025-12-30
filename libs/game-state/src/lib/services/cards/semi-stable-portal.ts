/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Semi-Stable Portal - 2 Mana: Summon a random 2-Cost minion.
export const SemiStablePortal: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SemiStablePortal_TIME_000],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SemiStablePortal.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				SemiStablePortal.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 2),
				input.options,
			),
		};
	},
};
