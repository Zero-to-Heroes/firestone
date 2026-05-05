import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const TheArcanomicon: GeneratingCard = {
	cardIds: [CardIds.TheArcanomicon_MEND_505],
	publicCreator: true,
	hasSequenceInfo: true,
	guessCardId: (input: GuessCardIdInput) => {
		return input.createdIndex === 0
			? CardIds.TheArcanomicon_EnergizeToken_MEND_505t
			: input.createdIndex === 1
				? CardIds.TheArcanomicon_UnblockToken_MEND_505t2
				: CardIds.TheArcanomicon_EmpowerToken_MEND_505t3;
	},
};
