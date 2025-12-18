/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard, GuessCardIdInput } from './_card.type';

export const ReplicatorInator: GeneratingCard = {
	cardIds: [CardIds.TheReplicatorInator_MIS_025],
	publicCreator: true,
	guessCardId: (input: GuessCardIdInput): string | null => {
		if (input.createdIndex === 0) {
			return CardIds.TheReplicatorInator_TheReplicatorInatorMiniToken_MIS_025t;
		} else if (input.createdIndex === 1) {
			return CardIds.TheReplicatorInator_TheReplicatorInatorToken_MIS_025t1;
		}
		return null;
	},
};
