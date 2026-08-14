/* eslint-disable no-mixed-spaces-and-tabs */
// Forgotten Millennium (TIME_615): 8 Mana
// "Fill your hand with random Undead. They cost Health instead of Mana this turn."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.UNDEAD);

export const ForgottenMillennium: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ForgottenMillennium_TIME_615],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ForgottenMillennium.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ForgottenMillennium.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.UNDEAD], possibleCards };
	},
};
