import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const TheArcanomicon: GeneratingCard = {
	cardIds: [CardIds.TheArcanomicon_MEND_505],
	publicCreator: true,
	hasSequenceInfo: true,
	guessCardId: (input: GuessCardIdInput) => {
		return input.createdIndex === 0
			? CardIds.BurstingLeyline_MEND_500
			: input.createdIndex === 1
				? CardIds.CrystallizedLeyline_MEND_502
				: CardIds.LeylineNexus_MEND_504;
	},
};
