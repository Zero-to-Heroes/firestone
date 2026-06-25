/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Scramblefor Gear (JAIL_386)
 * Gain 2 Armor. Shuffle five Gear spells into your deck that give 2 Armor when drawn.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const ScrambleforGear: GeneratingCard = {
	cardIds: [CardIds.ScrambleforGear_JAIL_386],
	publicCreator: true,
	guessCardId: (_input: GuessCardIdInput) => CardIds.FoundGear_JAIL_386t,
};
