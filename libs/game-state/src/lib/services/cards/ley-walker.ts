/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/framework/core';
import { GuessedInfo } from '../../models/deck-card';
import { isLeylineFranchiseReferenceCard, LEYLINE_FRANCHISE_CARD_IDS } from '../card-highlight/selectors';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const LeyWalker: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.MageMend501LeyWalker as unknown as CardIds],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			TempCardIds.MageMend501LeyWalker,
			input.allCards,
			(c: ReferenceCard) => LEYLINE_FRANCHISE_CARD_IDS.includes(c.id) || isLeylineFranchiseReferenceCard(c),
			input.inputOptions,
		),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(
			TempCardIds.MageMend501LeyWalker,
			input.allCards,
			(c: ReferenceCard) => LEYLINE_FRANCHISE_CARD_IDS.includes(c.id) || isLeylineFranchiseReferenceCard(c),
			input.options,
		);
		return { possibleCards };
	},
};
