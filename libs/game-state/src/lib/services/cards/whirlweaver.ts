/* eslint-disable no-mixed-spaces-and-tabs */
// Whirlweaver (NX2_003): 3 Mana 4/3 ELEMENTAL
// "[x]<b>Battlecry:</b> If you've cast a spell last turn, <b>Discover</b> an Elemental."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL) && canBeDiscoveredByClass(c, currentClass);

export const Whirlweaver: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Whirlweaver],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Whirlweaver.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Whirlweaver.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.ELEMENTAL], possibleCards };
	},
};
