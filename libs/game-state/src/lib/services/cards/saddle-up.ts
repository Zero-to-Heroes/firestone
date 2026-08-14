/* eslint-disable no-mixed-spaces-and-tabs */
// Saddle Up! (WW_812): 3 Mana
// "Give your minions "<b>Deathrattle:</b> Summon a random Beast that costs (3) or less.""

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && hasCost(c, '<=', 3);

export const SaddleUp: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SaddleUp_WW_812],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(SaddleUp.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(SaddleUp.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.BEAST], possibleCards };
	},
};
