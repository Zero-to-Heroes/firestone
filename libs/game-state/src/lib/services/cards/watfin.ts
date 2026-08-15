/* eslint-disable no-mixed-spaces-and-tabs */
// Watfin (JAIL_EVENT_100): 2 Mana 3/2 Neutral Beast
// "<b>Battlecry:</b> <b>Discover</b> a minion. Pick the <i>suspicious</i> one to gain +1/+1."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.MINION) && canBeDiscoveredByClass(c, currentClass);

export const Watfin: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Watfin_JAIL_EVENT_100],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			Watfin.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Watfin.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.MINION, possibleCards };
	},
};
