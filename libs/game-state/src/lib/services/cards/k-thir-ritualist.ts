/* eslint-disable no-mixed-spaces-and-tabs */
// K'Thir Ritualist (DMF_081)
// Battlecry: Add a random 4-Cost minion to your opponent's hand.
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const KthirRitualist: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.KthirRitualist],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			KthirRitualist.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			KthirRitualist.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4),
			input.options,
		);
		return {
			possibleCards,
		};
	},
};
