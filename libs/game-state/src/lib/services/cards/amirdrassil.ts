/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../..';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Amirdrassil: StaticGeneratingCard = {
	cardIds: [CardIds.Amirdrassil_FIR_907],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const card = input.entityId
			? input.inputOptions.gameState.fullGameState?.Player.AllEntities?.find((e) => e.entityId === input.entityId)
			: null;
		const cost = card?.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? 1;
		const possibleCards = filterCards(
			Amirdrassil.cardIds[0],
			input.allCards,
			(c) => c.cost === cost && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
		return possibleCards;
	},
};
