/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Soldier of Onyxia (CATA_780t): When summoned, get a random 2-Cost minion (Health cost this turn).
 * Herald upgrades — stored cost comes from {@link GameTag.TAG_SCRIPT_DATA_NUM_1} on the entity.
 *
 * Reference: tags.TAG_SCRIPT_DATA_NUM_1 = 2 in cards_short.json (pool cost, not the minion's mana cost).
 */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { resolveStoredRandomMinionCost } from './stored-random-minion-cost';
import { filterCards } from './utils';

const SOLDIER_TOKEN_ID = CardIds.ObsessiveTechnician_SoldierOfOnyxiaToken_CATA_780t;

export const SoldierOfOnyxia: StaticGeneratingCard = {
	cardIds: [SOLDIER_TOKEN_ID],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const cost = resolveStoredRandomMinionCost(input, SOLDIER_TOKEN_ID);
		return filterCards(
			SOLDIER_TOKEN_ID,
			input.allCards,
			(c) => c.cost === cost && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
