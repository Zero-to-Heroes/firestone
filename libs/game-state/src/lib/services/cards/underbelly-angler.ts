// Underbelly Angler (DAL_049): 2 Mana 2/2 Neutral Murloc minion
// "After you play a Murloc, add a random Murloc to your hand."
// Since it adds a card to hand, it needs both dynamicPool and guessInfo

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const UnderbellyAngler: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.UnderbellyAngler],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			UnderbellyAngler.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				UnderbellyAngler.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC),
				input.options,
			),
		};
	},
};
