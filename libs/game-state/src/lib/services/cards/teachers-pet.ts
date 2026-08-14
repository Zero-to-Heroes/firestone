/* eslint-disable no-mixed-spaces-and-tabs */
// Teacher's Pet (SCH_244): 5 Mana 4/5 BEAST
// "[x]<b>Taunt</b> <b>Deathrattle:</b> Summon a random 3-Cost Beast."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCost } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST) && hasCost(c, '==', 3);

export const TeachersPet: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TeachersPet],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TeachersPet.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(TeachersPet.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.BEAST], cost: 3, possibleCards };
	},
};
