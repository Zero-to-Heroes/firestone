// TIME_211t1: The Well of Eternity
// "Fill your hand with random Temporary spells."
// 
// TIME_211t1t: The Well of Eternity (Enhanced)
// "Fill your hand with random Temporary spells. They cast twice."
// 
// These cards fill the hand with random spells from the pool.
// The spells become "Temporary" when created, so the dynamic pool
// should include all spells available in the current game format.

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TheWellOfEternity: GeneratingCard & StaticGeneratingCard = {
	cardIds: [
		CardIds.LadyAzshara_TheWellOfEternityToken_TIME_211t1,
		CardIds.TheWellOfEternity_TheWellOfEternityToken_TIME_211t1t,
	],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			input.cardId,
			input.allCards,
			(c) => hasCorrectType(c, CardType.SPELL),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				TheWellOfEternity.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.SPELL),
				input.options,
			),
		};
	},
};
