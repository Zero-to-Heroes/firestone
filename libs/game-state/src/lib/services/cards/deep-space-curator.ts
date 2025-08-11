/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

export const DeepSpaceCurator: GeneratingCard = {
	cardIds: [CardIds.DeepSpaceCurator_GDB_311],
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const cost = input.options?.tags?.find((tag) => tag.Name === GameTag.COST)?.Value;
		return cost != null
			? {
					cost: cost,
				}
			: null;
	},
};
