/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { getEntityTag } from '../../services/parser-entity-utils';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const Amirdrassil: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.Amirdrassil_FIR_907],
	publicCreator: false,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = [];
		return { possibleCards };
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const entity = input.entityId
			? input.inputOptions.gameState.parserState?.CurrentEntities.get(input.entityId)
			: null;
		const cost = entity ? getEntityTag(entity, GameTag.TAG_SCRIPT_DATA_NUM_1, 1) : 1;
		const possibleCards = filterCards(
			Amirdrassil.cardIds[0],
			input.allCards,
			(c) => c.cost === cost && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
		return possibleCards;
	},
};
