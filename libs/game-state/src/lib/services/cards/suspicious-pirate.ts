/* eslint-disable no-mixed-spaces-and-tabs */
// Suspicious Pirate (REV_006): 3 Mana 3/4 PIRATE
// "<b>Battlecry:</b> <b>Discover</b> a weapon. If your opponent guesses your choice, they get a copy."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.WEAPON) && canBeDiscoveredByClass(c, currentClass);

export const SuspiciousPirate: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SuspiciousPirate],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			SuspiciousPirate.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			SuspiciousPirate.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.WEAPON, possibleCards };
	},
};
