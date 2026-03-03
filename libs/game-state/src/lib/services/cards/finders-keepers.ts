/* eslint-disable no-mixed-spaces-and-tabs */
// Finder's Keepers (UNG_028): 1 Mana Shaman spell
// "<b>Discover</b> a card with <b>Overload</b>."

import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const FindersKeepers: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.FindersKeepers],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.currentClass;
		return filterCards(
			FindersKeepers.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.OVERLOAD) && canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		const possibleCards = filterCards(
			FindersKeepers.cardIds[0],
			input.allCards,
			(c) => hasMechanic(c, GameTag.OVERLOAD) && canBeDiscoveredByClass(c, currentClass),
			input.options,
		);
		return {
			possibleCards: possibleCards,
		};
	},
};
