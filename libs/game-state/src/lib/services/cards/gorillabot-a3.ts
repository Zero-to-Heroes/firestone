/* eslint-disable no-mixed-spaces-and-tabs */
// Gorillabot A-3 (LOE_039 / CORE_LOE_039): 3 Mana 3/4 MECH
// "<b>Battlecry:</b> If you control another Mech, <b>Discover</b> a Mech."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MECH) && canBeDiscoveredByClass(c, currentClass);

export const GorillabotA3: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GorillabotA3, CardIds.GorillabotA3Core],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			GorillabotA3.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			GorillabotA3.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.MECH], possibleCards };
	},
};
