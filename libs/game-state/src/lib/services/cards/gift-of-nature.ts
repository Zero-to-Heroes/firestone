/* eslint-disable no-mixed-spaces-and-tabs */
// Gift of Nature (EDR_872B): 1 Mana
// "<b>Discover</b> a Druid spell."

import { CardIds, CardType, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.DRUID) && canBeDiscoveredByClass(c, currentClass);

export const GiftOfNature: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GiftOfNature_EDR_872B],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			GiftOfNature.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			GiftOfNature.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, cardClasses: [CardClass.DRUID], possibleCards };
	},
};
