/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Holy Embrace (JAIL_941)
 * Restore 4 Health. Get a 'Dark Embrace' that deals 4 damage.
 */
import { CardIds } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const HolyEmbrace: GeneratingCard = {
	cardIds: [TempCardIds.HolyEmbrace_JAIL_941 as unknown as CardIds],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => TempCardIds.DarkEmbrace_JAIL_941t as unknown as CardIds,
};
