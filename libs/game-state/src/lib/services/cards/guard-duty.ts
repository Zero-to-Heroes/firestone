/* eslint-disable no-mixed-spaces-and-tabs */
// Guard Duty (DINO_433): 7 Mana
// "Summon a random 6, 4, and 2-Cost <b>Taunt</b> minion."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) &&
	hasMechanic(c, GameTag.TAUNT) &&
	(hasCost(c, '==', 6) || hasCost(c, '==', 4) || hasCost(c, '==', 2));

export const GuardDuty: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.GuardDuty_DINO_433],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(GuardDuty.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(GuardDuty.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, mechanics: [GameTag.TAUNT], possibleCards };
	},
};
