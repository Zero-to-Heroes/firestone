/* eslint-disable no-mixed-spaces-and-tabs */
// Instructor Fireheart (SCH_507): 3 Mana 3/3
// "[x]<b>Battlecry:</b> <b>Discover</b> a spell that costs (1) or more. If you play it this turn, repeat this effect."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass, isUnplayable } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) &&
	hasCost(c, '>=', 1) &&
	!isUnplayable(c) &&
	canBeDiscoveredByClass(c, currentClass);

export const InstructorFireheart: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.InstructorFireheart],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			InstructorFireheart.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			InstructorFireheart.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
