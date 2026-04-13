/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { getEntityTag } from '../../services/parser-entity-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const OnyxiasWing: StaticGeneratingCard = {
	cardIds: [CardIds.ArisenOnyxia_OnyxiasWingToken_CATA_155t, CardIds.ArisenOnyxia_OnyxiasWingToken_CATA_155t1],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const entity = input.entityId
			? input.inputOptions.gameState.parserState?.CurrentEntities.get(input.entityId)
			: null;
		const cost = entity ? getEntityTag(entity, GameTag.TAG_SCRIPT_DATA_NUM_1, 2) : 2;
		return filterCards(
			OnyxiasWing.cardIds[0],
			input.allCards,
			(c) => c.cost === cost && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
