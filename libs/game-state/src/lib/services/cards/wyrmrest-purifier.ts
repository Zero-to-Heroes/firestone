/* eslint-disable no-mixed-spaces-and-tabs */
// Wyrmrest Purifier (DRG_062): 2 Mana 3/2
// "[x]<b>Battlecry:</b> Transform all Neutral cards in your deck into random cards from your class."

import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) => canBeDiscoveredByClass(c, currentClass);

export const WyrmrestPurifier: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WyrmrestPurifier],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			WyrmrestPurifier.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			WyrmrestPurifier.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { possibleCards };
	},
};
