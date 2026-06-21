/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Contraband Wands (JAIL_312)
 * Get 3 Arcane Missiles.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const ContrabandWands: GeneratingCard = {
	cardIds: [TempCardIds.ContrabandWands_JAIL_312 as unknown as CardIds],
	publicCreator: true,
	guessInfo: (_input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		possibleCards: [CardIds.ArcaneMissilesLegacy],
	}),
};
