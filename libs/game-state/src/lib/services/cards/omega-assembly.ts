/* eslint-disable no-mixed-spaces-and-tabs */
// Omega Assembly (BOT_299): 1 Mana
// "<b>Discover</b> a Mech. If you have 10 Mana Crystals, keep all 3 instead."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MECH) && canBeDiscoveredByClass(c, currentClass);

export const OmegaAssembly: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.OmegaAssembly],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			OmegaAssembly.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			OmegaAssembly.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.MECH], possibleCards };
	},
};
