/* eslint-disable no-mixed-spaces-and-tabs */
// School Teacher (TSC_052): 4 Mana 5/4 NAGA
// "<b>Battlecry:</b> Add a 1/1 Nagaling to your hand. <b>Discover</b> a spell that costs (3) or less to teach it."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) && hasCost(c, '<=', 3) && canBeDiscoveredByClass(c, currentClass);

export const SchoolTeacher: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SchoolTeacher],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			SchoolTeacher.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SchoolTeacher.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
