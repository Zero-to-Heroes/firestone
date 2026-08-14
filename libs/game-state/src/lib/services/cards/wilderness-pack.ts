/* eslint-disable no-mixed-spaces-and-tabs */
// Wilderness Pack (MIS_104): 1 Mana
// "Add 5 random Beasts to your hand. They are <b>Temporary</b>."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST);

export const WildernessPack: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WildernessPack_MIS_104],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(WildernessPack.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(WildernessPack.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.BEAST], possibleCards };
	},
};
