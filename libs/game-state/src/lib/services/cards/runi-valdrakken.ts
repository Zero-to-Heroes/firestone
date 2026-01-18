/* eslint-disable no-mixed-spaces-and-tabs */
// Runi, Time Explorer - Valdrakken (WON_053t5)
// Text: "Get two random Dragons with +2/+2"
// This card adds dragons to hand, so it needs both GeneratingCard and StaticGeneratingCard

import { CardIds, CardType, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isDragonMinion = (c: ReferenceCard): boolean =>
	hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAGON);

export const RuniValdrakken: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RuniTimeExplorer_ValdrakkenToken_WON_053t5],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(RuniValdrakken.cardIds[0], input.allCards, isDragonMinion, input.inputOptions);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.DRAGON],
			attackBuff: 2,
			healthBuff: 2,
			possibleCards: filterCards(RuniValdrakken.cardIds[0], input.allCards, isDragonMinion, input.options),
		};
	},
};
