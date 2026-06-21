/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Aya Lotus Kingpin (JAIL_504)
 * You always go second. Battlecry: Pick an upgraded counterfeit to replace your Coins this game. Get two.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { and, coinExtended, inDeck, inHand, or, side } from '../card-highlight/selectors';
import { GeneratingCard, GuessInfoInput, SelectorCard } from './_card.type';

const COIN_OPTIONS = [
	TempCardIds.JadeCoin_JAIL_504t as unknown as CardIds,
	TempCardIds.GrimyCoin_JAIL_504t2 as unknown as CardIds,
	TempCardIds.KabalCoin_JAIL_504t3 as unknown as CardIds,
];

export const AyaLotusKingpin: GeneratingCard & SelectorCard = {
	cardIds: [TempCardIds.AyaLotusKingpin_JAIL_504 as unknown as CardIds],
	publicCreator: true,
	guessInfo: (_input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		possibleCards: COIN_OPTIONS,
	}),
	selector: (inputSide) => and(side(inputSide), or(inHand, inDeck), coinExtended),
};
