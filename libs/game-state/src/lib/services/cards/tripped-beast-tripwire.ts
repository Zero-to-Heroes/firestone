/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Tripped Beast Tripwire (JAIL_879t)
 * Casts When Drawn. Summon a random 5-Cost Beast.
 */
import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const beastFilter = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 5) && hasCorrectTribe(c, Race.BEAST);

export const TrippedBeastTripwire: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TrippedBeastTripwire_JAIL_879t],
	publicCreator: true,
	summonInPlay: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.TrippedBeastTripwire_JAIL_879t,
			input.allCards,
			beastFilter,
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.MINION,
		cost: { cost: 5, comparison: '==' },
		races: [Race.BEAST],
		possibleCards: filterCards(
			CardIds.TrippedBeastTripwire_JAIL_879t,
			input.allCards,
			beastFilter,
			input.options,
		),
	}),
};
