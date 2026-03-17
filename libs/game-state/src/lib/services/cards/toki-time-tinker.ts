/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameFormat, GameType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { isCardValidForGame } from '../card-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TokiTimeTinker: StaticGeneratingCard = {
	cardIds: [CardIds.TokiTimeTinker_GIL_549],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			TokiTimeTinker.cardIds[0],
			input.allCards,
			(c) =>
				!isCardValidForGame(c, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
				hasCorrectType(c, CardType.MINION),
		);
	},
};
