/* eslint-disable no-mixed-spaces-and-tabs */
// Mount Hyjal Imposter (WON_077): 4 Mana 4/4 Rogue minion
// "[x]Each turn this is in your hand, transform it into a random 4-Cost minion that gains <b>Stealth</b>."
// The minion transforms in hand, so it needs guessInfo for hand tracking

import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCost, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const MountHyjalImposter: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MountHyjalImposter_WON_077],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			MountHyjalImposter.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			MountHyjalImposter.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && hasCost(c, '==', 4),
			input.options,
		);
		return {
			cardType: CardType.MINION,
			possibleCards: possibleCards,
		};
	},
};
