/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Emergency Surgery (JAIL_454)
 * Choose an enemy minion. Summon three 3/1 Undead with Lifesteal that attack it.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const EmergencySurgery: GeneratingCard = {
	cardIds: [CardIds.EmergencySurgery_JAIL_454],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.Necronurse_JAIL_454t,
};
