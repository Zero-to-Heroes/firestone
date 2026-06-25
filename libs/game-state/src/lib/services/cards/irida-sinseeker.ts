/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Irida Sinseeker (JAIL_719)
 * Lifesteal. Battlecry: Send your deck to the Void. At the start of your turns, get two cards from the Void.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// TODO: maybe add a hook when the power is triggered to store the current deck?
export const IridaSinseeker: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.IridaSinseeker_JAIL_719],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Get the list of cards sent to the Void
		// Get the list of these cards that have been played (or that we know have left the Void)
		// Return the list of cards that are left in the Void
		return [];
	},
	guessInfo: (input: GuessInfoInput) => {
		return null;
	},
};
