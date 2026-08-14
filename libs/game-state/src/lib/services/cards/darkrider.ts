/* eslint-disable no-mixed-spaces-and-tabs */
// Darkrider (EDR_456): 1 Mana 1/1 DEMON
// "<b>Battlecry:</b> If you're holding a Dragon, <b>Discover</b> a Dragon with a <b>Dark Gift</b>."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON) && canBeDiscoveredByClass(c, currentClass);

export const Darkrider: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Darkrider_EDR_456],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Darkrider.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Darkrider.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.DRAGON], possibleCards };
	},
};
