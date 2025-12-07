/* eslint-disable no-mixed-spaces-and-tabs */
import {
	CardIds,
	CardType,
	GameFormat,
	GameType,
	hasCorrectTribe,
	isValidSet,
	Race,
	SetId,
} from '@firestone-hs/reference-data';
import { filterCards, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const HemetFoamMarksman: StaticGeneratingCard = {
	cardIds: [CardIds.HemetFoamMarksman_TOY_355],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			input.allCards,
			// So that we don't get cards from the arena-specific pool instead
			{ ...input.inputOptions, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
			HemetFoamMarksman.cardIds[0],
			(c) =>
				!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.BEAST),
		);
	},
};
