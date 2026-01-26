/* eslint-disable no-mixed-spaces-and-tabs */
// Lifeweaver (DAL_355)
// 3-Cost Druid Minion
// Whenever you restore Health, add a random Druid spell to your hand.

import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Lifeweaver: GeneratingCard & StaticGeneratingCard = {
cardIds: [CardIds.Lifeweaver],
publicCreator: true,
dynamicPool: (input: StaticGeneratingCardInput) => {
return filterCards(
Lifeweaver.cardIds[0],
input.allCards,
(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.DRUID),
input.inputOptions,
);
},
guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
return {
cardType: CardType.SPELL,
cardClasses: [CardClass.DRUID],
possibleCards: filterCards(
Lifeweaver.cardIds[0],
input.allCards,
(c) => hasCorrectType(c, CardType.SPELL) && hasCorrectClass(c, CardClass.DRUID),
input.options,
),
};
},
};
