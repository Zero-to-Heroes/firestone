/* eslint-disable no-mixed-spaces-and-tabs */
// Oasis Outlaws (WW_404): 1 Mana
// "<b>Discover</b> a Naga. If you've played a Naga while holding this, reduce its Cost by (1)."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.NAGA) && canBeDiscoveredByClass(c, currentClass);

export const OasisOutlaws: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.OasisOutlaws_WW_404],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			OasisOutlaws.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			OasisOutlaws.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.NAGA], possibleCards };
	},
};
