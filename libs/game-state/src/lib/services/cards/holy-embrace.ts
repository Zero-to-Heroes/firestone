/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Holy Embrace (JAIL_941)
 * Restore 4 Health. Get a 'Dark Embrace' that deals 4 damage.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const HolyEmbrace: GeneratingCard = {
	cardIds: [CardIds.HolyEmbrace_JAIL_941],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.DarkEmbrace_JAIL_941t,
};
