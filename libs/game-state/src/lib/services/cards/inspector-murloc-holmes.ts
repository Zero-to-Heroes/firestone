/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Inspector Murloc Holmes (JAIL_851)
 * Battlecry: Investigate a card in the enemy hand. If they play a card with that name next turn, get 3 Coins.
 */
import { CardIds } from '@firestone-hs/reference-data';

import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const InspectorMurlocHolmes: GeneratingCard = {
	cardIds: [CardIds.InspectorMurlocHolmes_JAIL_851],
	publicCreator: true,
	guessCardId: (input: GuessCardIdInput) => CardIds.TheCoinCore,
};
