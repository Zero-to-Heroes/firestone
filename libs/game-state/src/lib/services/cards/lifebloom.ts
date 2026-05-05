/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Lifebloom: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Lifebloom_MEND_042],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.Lifebloom_MEND_042,
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			CardIds.Lifebloom_MEND_042,
			input.allCards,
			(c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 8),
			input.options,
		);
		return { cardType: CardType.MINION, possibleCards };
	},
};
