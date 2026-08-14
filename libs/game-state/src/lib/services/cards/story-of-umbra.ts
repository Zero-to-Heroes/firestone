/* eslint-disable no-mixed-spaces-and-tabs */
// Story of Umbra (DINO_415): 7 Mana
// "[x]<b>Discover</b> a <b>Deathrattle</b> minion that costs (5) or more. Summon it and trigger its <b>Deathrattle</b>."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasMechanic(c, GameTag.DEATHRATTLE) &&
	hasCost(c, '>=', 5) &&
	canBeDiscoveredByClass(c, currentClass);

export const StoryOfUmbra: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.StoryOfUmbra_DINO_415],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			StoryOfUmbra.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			StoryOfUmbra.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, mechanics: [GameTag.DEATHRATTLE], possibleCards };
	},
};
