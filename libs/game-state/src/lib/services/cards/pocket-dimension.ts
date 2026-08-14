/* eslint-disable no-mixed-spaces-and-tabs */
// Pocket Dimension (GDB_133): 4 Mana
// "<b>Discover</b> a spell. Repeat until you see one for the second time."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass);

export const PocketDimension: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PocketDimension_GDB_133],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			PocketDimension.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			PocketDimension.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
