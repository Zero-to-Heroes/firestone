/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Ripple in Time (TOT_345)
// "<b>Discover</b> a minion. If you play it this turn, it has <b>Echo</b>."
export const RippleInTime: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RippleInTime],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			RippleInTime.cardIds[0],
			input.allCards,
			(c) => hasCorrectType(c, CardType.MINION) && canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			possibleCards: filterCards(
				RippleInTime.cardIds[0],
				input.allCards,
				(c) => hasCorrectType(c, CardType.MINION) && canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
				input.options,
			),
		};
	},
};
