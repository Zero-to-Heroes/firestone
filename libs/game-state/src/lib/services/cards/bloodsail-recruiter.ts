/* eslint-disable no-mixed-spaces-and-tabs */
// Bloodsail Recruiter (VAC_430): 2 Mana 4/1 PIRATE
// "<b>Battlecry:</b> <b>Discover</b> a Pirate."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.PIRATE) && canBeDiscoveredByClass(c, currentClass);

export const BloodsailRecruiter: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BloodsailRecruiter_VAC_430],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			BloodsailRecruiter.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			BloodsailRecruiter.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, races: [Race.PIRATE], possibleCards };
	},
};
