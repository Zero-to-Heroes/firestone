/* eslint-disable no-mixed-spaces-and-tabs */
// Exarch Hataaru (GDB_136): 5 Mana 5/5 DRAENEI
// "<b>Battlecry:</b> <b>Discover</b> a spell and reduce its Cost by (1). If you play it this turn, repeat this effect."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard, currentClass?: string) =>
	hasCorrectType(c, CardType.SPELL) && canBeDiscoveredByClass(c, currentClass);

export const ExarchHataaru: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ExarchHataaru_GDB_136],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			ExarchHataaru.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.inputOptions.currentClass),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			ExarchHataaru.cardIds[0],
			input.allCards,
			(c) => isMatch(c, input.options.currentClass),
			input.options,
		);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
