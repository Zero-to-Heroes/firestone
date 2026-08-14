/* eslint-disable no-mixed-spaces-and-tabs */
// Scarab Keychain (TOY_006): 1 Mana 1/1 BEAST
// "<b>Battlecry:</b> <b>Discover</b> a 2-Cost card."

import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCost(c, '==', 2) && canBeDiscoveredByClass(c, currentClass);

export const ScarabKeychain: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ScarabKeychain_TOY_006],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			ScarabKeychain.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			ScarabKeychain.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cost: 2, possibleCards };
	},
};
