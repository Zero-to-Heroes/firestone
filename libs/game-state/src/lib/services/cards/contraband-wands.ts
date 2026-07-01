/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Contraband Wands (JAIL_312)
 * Get 3 Arcane Missiles.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const ContrabandWands: GeneratingCard = {
	cardIds: [CardIds.ContrabandWands_JAIL_312],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput): string | null => CardIds.ArcaneMissilesLegacy,
};
