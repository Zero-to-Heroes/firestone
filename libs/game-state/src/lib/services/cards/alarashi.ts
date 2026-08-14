/* eslint-disable no-mixed-spaces-and-tabs */
// Alara'shi (EDR_493): 5 Mana 5/5 BEAST
// "[x]<b>Battlecry:</b> Transform minions in your hand into random Demons. <i>(They keep their original stats and Cost.)</I>"

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON);

export const Alarashi: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Alarashi_EDR_493],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Alarashi.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Alarashi.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.DEMON], possibleCards };
	},
};
