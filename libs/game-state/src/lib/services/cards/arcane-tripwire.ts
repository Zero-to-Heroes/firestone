/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Arcane Tripwire (JAIL_881)
 * Deal 5 damage split among all enemies. Shuffle 2 spells into your deck that do it again when drawn.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const ArcaneTripwire: GeneratingCard = {
	cardIds: [TempCardIds.ArcaneTripwire_JAIL_881 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.TrippedArcaneTripwire_JAIL_881t as unknown as CardIds,
};
