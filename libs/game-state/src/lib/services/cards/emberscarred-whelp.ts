/* eslint-disable no-mixed-spaces-and-tabs */
// Emberscarred Whelp (FIR_927): 3 Mana 3/2 DRAGON
// "[x]<b>Battlecry:</b> <b>Discover</b> a 5-Cost card. Gain 1 Mana Crystal next turn only."

import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCost, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCost(c, '==', 5) && canBeDiscoveredByClass(c, currentClass);

export const EmberscarredWhelp: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.EmberscarredWhelp_FIR_927],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			EmberscarredWhelp.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			EmberscarredWhelp.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cost: 5, possibleCards };
	},
};
