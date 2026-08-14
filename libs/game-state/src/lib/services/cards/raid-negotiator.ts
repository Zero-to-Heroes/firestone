/* eslint-disable no-mixed-spaces-and-tabs */
// Raid Negotiator (ONY_019): 4 Mana 3/4
// "[x]<b>Battlecry:</b> <b>Discover</b> a <b>Choose One</b> card. It has both effects combined."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasMechanic(c, GameTag.CHOOSE_ONE) && canBeDiscoveredByClass(c, currentClass);

export const RaidNegotiator: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RaidNegotiator],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			RaidNegotiator.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			RaidNegotiator.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { mechanics: [GameTag.CHOOSE_ONE], possibleCards };
	},
};
