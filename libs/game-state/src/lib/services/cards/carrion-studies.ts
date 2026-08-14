/* eslint-disable no-mixed-spaces-and-tabs */
// Carrion Studies (SCH_300): 1 Mana
// "<b>Discover</b> a <b>Deathrattle</b> minion. Your next one costs (1) less."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasMechanic(c, GameTag.DEATHRATTLE) &&
	canBeDiscoveredByClass(c, currentClass);

export const CarrionStudies: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.CarrionStudies],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CarrionStudies.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			CarrionStudies.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, mechanics: [GameTag.DEATHRATTLE], possibleCards };
	},
};
