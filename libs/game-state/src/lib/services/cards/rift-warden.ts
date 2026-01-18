/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Rift Warden (TOT_102)
// "Battlecry: Put a random minion that costs (5) or more on top of your deck. It costs (0)."
export const RiftWarden: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RiftWarden],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			RiftWarden.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '>=', 5),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			cost: { cost: 5, comparison: '>=' },
			possibleCards: filterCards(
				RiftWarden.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '>=', 5),
				input.options,
			),
		};
	},
};
