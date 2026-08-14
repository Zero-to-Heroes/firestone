/* eslint-disable no-mixed-spaces-and-tabs */
// Paleomancy (TLC_434): 3 Mana
// "<b>Discover</b> an Undead. Spend 5 <b>Corpses</b> to keep all 3 instead."

import { CardIds, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectTribe(c, Race.UNDEAD) && canBeDiscoveredByClass(c, currentClass);

export const Paleomancy: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Paleomancy_TLC_434],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Paleomancy.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Paleomancy.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { races: [Race.UNDEAD], possibleCards };
	},
};
