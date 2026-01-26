/* eslint-disable no-mixed-spaces-and-tabs */
// Fishflinger (ULD_289): 2 Mana 3/2 Neutral Murloc minion
// "<b>Battlecry:</b> Add a random Murloc to each player's hand."
// The minion is added to hand (random, not discover), so it needs dynamicPool + guessInfo

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Fishflinger: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Fishflinger],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Fishflinger.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Fishflinger.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			races: [Race.MURLOC],
			possibleCards: possibleCards,
		};
	},
};
