/* eslint-disable no-mixed-spaces-and-tabs */
// Undefeated Champion (TIME_872): 8 Mana 13/13
// "[x]<b>Rush</b>. <b>Battlecry:</b> Fill your opponent's board with random 1-Cost minions."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 1);

export const UndefeatedChampion: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.UndefeatedChampion_TIME_872],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(UndefeatedChampion.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(UndefeatedChampion.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, cost: 1, possibleCards };
	},
};
