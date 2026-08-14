/* eslint-disable no-mixed-spaces-and-tabs */
// Submerged Map (TLC_442): 1 Mana
// "[x]<b>Discover</b> a Murloc. If you play it this turn, also pick one of the others."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC) && canBeDiscoveredByClass(c, currentClass);

export const SubmergedMap: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SubmergedMap_TLC_442],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			SubmergedMap.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SubmergedMap.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.MURLOC], possibleCards };
	},
};
