/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

// Ripple in Time (TOT_345)
// "<b>Discover</b> a minion from your deck. It has <b>Echo</b>."
export const RippleInTime: GeneratingCard = {
	cardIds: [CardIds.RippleInTime],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		// Discovers from deck, so the info is partial (we don't know what's in the deck)
		return {
			cardType: CardType.MINION,
		};
	},
};
