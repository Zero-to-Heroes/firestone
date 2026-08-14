/* eslint-disable no-mixed-spaces-and-tabs */
// Avant-Gardening (EDR_488): 2 Mana
// "[x]<b>Discover</b> a <b>Deathrattle</b> minion with a <b>Dark Gift</b>."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	hasMechanic(c, GameTag.DEATHRATTLE) &&
	canBeDiscoveredByClass(c, currentClass);

export const AvantGardening: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.AvantGardening_EDR_488],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			AvantGardening.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			AvantGardening.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, mechanics: [GameTag.DEATHRATTLE], possibleCards };
	},
};
