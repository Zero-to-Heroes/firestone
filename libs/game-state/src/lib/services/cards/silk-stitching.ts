/* eslint-disable no-mixed-spaces-and-tabs */
// Silk Stitching (TOY_822): 2 Mana
// "Choose a friendly minion. <b>Discover</b> a spell that costs (4) or less for it to cast when it dies."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) && hasCost(c, '<=', 4) && canBeDiscoveredByClass(c, currentClass);

export const SilkStitching: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SilkStitching_TOY_822],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			SilkStitching.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SilkStitching.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
