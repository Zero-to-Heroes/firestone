/* eslint-disable no-mixed-spaces-and-tabs */
// Smoke Bomb (FIR_920): 2 Mana
// "<b>Discover</b> a <b>Combo</b>, <b>Battlecry</b>, or <b>Stealth</b> minion with a <b>Dark Gift</b>."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) &&
	(hasMechanic(c, GameTag.COMBO) || hasMechanic(c, GameTag.BATTLECRY) || hasMechanic(c, GameTag.STEALTH)) &&
	canBeDiscoveredByClass(c, currentClass);

export const SmokeBomb: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SmokeBomb_FIR_920],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			SmokeBomb.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SmokeBomb.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, possibleCards };
	},
};
