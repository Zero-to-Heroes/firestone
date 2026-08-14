/* eslint-disable no-mixed-spaces-and-tabs */
// Netherspite Historian (KAR_062 / CORE_KAR_062): 2 Mana 2/3
// "<b>Battlecry:</b> If you're holding a Dragon, <b>Discover</b> a Dragon."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON) && canBeDiscoveredByClass(c, currentClass);

export const NetherspiteHistorian: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.NetherspiteHistorian, CardIds.NetherspiteHistorian_CORE_KAR_062],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			NetherspiteHistorian.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			NetherspiteHistorian.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.DRAGON], possibleCards };
	},
};
