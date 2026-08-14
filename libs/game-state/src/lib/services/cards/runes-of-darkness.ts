/* eslint-disable no-mixed-spaces-and-tabs */
// Runes of Darkness (YOG_511): 1 Mana
// "<b>Discover</b> a weapon. Spend 3 <b>Corpses</b> to give it +1/+1."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.WEAPON) && canBeDiscoveredByClass(c, currentClass);

export const RunesOfDarkness: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RunesOfDarkness_YOG_511],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			RunesOfDarkness.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			RunesOfDarkness.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.WEAPON, possibleCards };
	},
};
