/* eslint-disable no-mixed-spaces-and-tabs */
// Underlight Angling Rod (BT_018 / CORE_BT_018): 3 Mana 3/undefined
// "After your Hero attacks, add a random Murloc to your hand."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC);

export const UnderlightAnglingRod: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.UnderlightAnglingRod, CardIds.UnderlightAnglingRod_CORE_BT_018],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(UnderlightAnglingRod.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(UnderlightAnglingRod.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.MURLOC], possibleCards };
	},
};
