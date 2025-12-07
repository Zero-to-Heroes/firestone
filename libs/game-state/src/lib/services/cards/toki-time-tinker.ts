/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameFormat, GameType, SetId, isValidSet } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';
import { hasCorrectType } from '../../related-cards/dynamic-pools';

export const TokiTimeTinker: StaticGeneratingCard = {
	cardIds: [CardIds.TokiTimeTinker_GIL_549],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			TokiTimeTinker.cardIds[0],
			input.allCards,
			(c) =>
				!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
				hasCorrectType(c, CardType.MINION),
			{ ...input.inputOptions, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
		);
	},
};
