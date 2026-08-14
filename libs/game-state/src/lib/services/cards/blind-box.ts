/* eslint-disable no-mixed-spaces-and-tabs */
// Blind Box (TOY_643): 2 Mana
// "Get 2 random Demons. <b>Outcast:</b> <b>Discover</b> them instead."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DEMON);

export const BlindBox: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BlindBox_TOY_643],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(BlindBox.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(BlindBox.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.DEMON], possibleCards };
	},
};
