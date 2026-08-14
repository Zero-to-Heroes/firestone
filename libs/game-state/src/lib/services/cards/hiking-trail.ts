/* eslint-disable no-mixed-spaces-and-tabs */
// Hiking Trail (VAC_517): 3 Mana
// "<b>Discover</b> a <b>Taunt</b> minion. After you gain Armor, reopen this."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.TAUNT) && canBeDiscoveredByClass(c, currentClass);

export const HikingTrail: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HikingTrail_VAC_517],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			HikingTrail.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			HikingTrail.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, mechanics: [GameTag.TAUNT], possibleCards };
	},
};
