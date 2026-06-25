/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Arcane Tripwire (JAIL_881)
 * Deal 5 damage split among all enemies. Shuffle 2 spells into your deck that do it again when drawn.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const ArcaneTripwire: GeneratingCard = {
	cardIds: [CardIds.ArcaneTripwire_JAIL_881],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.TrippedArcaneTripwire_JAIL_881t,
};
