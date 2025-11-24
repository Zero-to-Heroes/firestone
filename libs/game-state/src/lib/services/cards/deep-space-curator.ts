/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { DeckState } from '../../models/deck-state';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { AllCardsService } from '@firestone-hs/reference-data';

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
