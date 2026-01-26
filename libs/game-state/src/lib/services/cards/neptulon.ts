/* eslint-disable no-mixed-spaces-and-tabs */
// Neptulon (GVG_042): 7 Mana 7/7 Shaman Elemental minion
// "<b>Battlecry:</b> Add 4 random Murlocs to your hand. <b>Overload:</b> (3)"
// The minions are added to hand (random, not discover), so it needs dynamicPool + guessInfo

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Neptulon: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Neptulon_GVG_042],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			Neptulon.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			Neptulon.cardIds[0],
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
