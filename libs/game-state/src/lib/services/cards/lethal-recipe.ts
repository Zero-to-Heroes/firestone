/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Lethal Recipe (JAIL_866)
 * Draw 2 minions. If you have 10 or more Mana, give them +3/+3.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { TempCardIds } from '@firestone/shared/framework/core';
import { and, inDeck, minion, side } from '../card-highlight/selectors';
import { Card, GeneratingCard, GuessInfoInput, SelectorCard } from './_card.type';

export const LethalRecipe: Card & SelectorCard & GeneratingCard = {
	cardIds: [TempCardIds.LethalRecipe_JAIL_866 as unknown as CardIds],
	publicTutor: true,
	selector: (inputSide) => and(side(inputSide), inDeck, minion),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
		};
	},
};
