/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Aya Lotus Kingpin (JAIL_504)
 * You always go second. Battlecry: Pick an upgraded counterfeit to replace your Coins this game. Get two.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { and, coinExtended, inDeck, inHand, or, side } from '../card-highlight/selectors';
import { GeneratingCard, GuessInfoInput, SelectorCard } from './_card.type';

const COIN_OPTIONS = [
	CardIds.JadeCoin_JAIL_504t,
	CardIds.GrimyCoin_JAIL_504t2,
	CardIds.KabalCoin_JAIL_504t3,
];

export const AyaLotusKingpin: GeneratingCard & SelectorCard = {
	cardIds: [CardIds.AyaLotusKingpin_JAIL_504],
	publicCreator: true,
	guessInfo: (_input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		possibleCards: COIN_OPTIONS,
	}),
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), coinExtended),
};
