/* eslint-disable no-mixed-spaces-and-tabs */
// Once Upon a Time... (TOY_506): 6 Mana
// "Summon a random 3-Cost Beast, Dragon, Elemental, and Murloc."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) &&
	hasCost(c, '==', 3) &&
	(hasCorrectTribe(c, Race.BEAST) ||
		hasCorrectTribe(c, Race.DRAGON) ||
		hasCorrectTribe(c, Race.ELEMENTAL) ||
		hasCorrectTribe(c, Race.MURLOC));

export const OnceUponATime: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.OnceUponATime_TOY_506],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(OnceUponATime.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(OnceUponATime.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, cost: 3, possibleCards };
	},
};
