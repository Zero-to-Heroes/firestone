/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Semi-Stable Portal (TIME_000)
// "<b>Rewind</b> Add a random minion to your hand. It costs (3) less."
export const SemiStablePortal: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.SemiStablePortal_TIME_000],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			SemiStablePortal.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				SemiStablePortal.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.MINION),
				input.options,
			),
		};
	},
};
