/* eslint-disable no-mixed-spaces-and-tabs */
// Maruut Stonebinder (DEEP_037): 7 Mana 5/6
// "[x]<b>Battlecry:</b> If your deck started with no duplicates, <b>Discover</b> an Elemental to summon. Add the others to your hand."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL) && canBeDiscoveredByClass(c, currentClass);

export const MaruutStonebinder: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MaruutStonebinder_DEEP_037],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			MaruutStonebinder.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			MaruutStonebinder.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.ELEMENTAL], possibleCards };
	},
};
