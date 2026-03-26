// Soldier of Sinestra (CATA_158t) - Token Minion
// Created by Maniacal Follower (CATA_158)
// Battlecry: Summon a random minion that costs (X).
/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { getEntityTag } from '../../services/parser-entity-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SoldierOfSinestra: StaticGeneratingCard = {
	cardIds: [CardIds.ManiacalFollower_SoldierOfSinestraToken_CATA_158t],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const entity = input.entityId
			? input.inputOptions.gameState.parserState?.CurrentEntities.get(input.entityId)
			: null;
		const cost = entity ? getEntityTag(entity, GameTag.TAG_SCRIPT_DATA_NUM_1, 1) : 1;
		return filterCards(
			SoldierOfSinestra.cardIds[0],
			input.allCards,
			(c) => c.cost === cost && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
