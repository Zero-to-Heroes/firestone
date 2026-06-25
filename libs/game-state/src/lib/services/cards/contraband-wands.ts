/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Contraband Wands (JAIL_312)
 * Get 3 Arcane Missiles.
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const ContrabandWands: GeneratingCard = {
	cardIds: [CardIds.ContrabandWands_JAIL_312],
	publicCreator: true,
	guessInfo: (_input: GuessInfoInput): GuessedInfo | null => ({
		cardType: CardType.SPELL,
		possibleCards: [CardIds.ArcaneMissilesLegacy],
	}),
};
