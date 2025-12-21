/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const WindowShopper: GeneratingCard = {
	cardIds: [CardIds.WindowShopper_TOY_652],
	publicCreator: true,
	hasSequenceInfo: true,
	guessCardId: (input: GuessCardIdInput): string | null => {
		if (input.createdIndex === 1) {
			return CardIds.WindowShopper_WindowShopperToken_TOY_652t;
		}
		return null;
	},
};
