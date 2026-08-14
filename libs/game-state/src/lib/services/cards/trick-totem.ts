/* eslint-disable no-mixed-spaces-and-tabs */
// Trick Totem (SCH_537): 2 Mana 0/3 TOTEM
// "At the end of your turn, cast a random spell that costs (3) or less."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasCost(c, '<=', 3);

export const TrickTotem: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TrickTotem_SCH_537],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TrickTotem.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(TrickTotem.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
