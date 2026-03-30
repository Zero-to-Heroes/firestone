/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Soldier of Onyxia (CATA_780t): When summoned, get a random 2-Cost minion (Health cost this turn).
 * Herald upgrades — stored cost comes from {@link GameTag.TAG_SCRIPT_DATA_NUM_1} on the entity.
 *
 * Reference: tags.TAG_SCRIPT_DATA_NUM_1 = 2 in cards_short.json (pool cost, not the minion's mana cost).
 */
import { CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { getEntityTag } from '../../services/parser-entity-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const SOLDIER_TOKEN_ID = CardIds.ObsessiveTechnician_SoldierOfOnyxiaToken_CATA_780t;

function resolveStoredMinionCost(input: StaticGeneratingCardInput): number {
	const { entityId, allCards, inputOptions } = input;
	const entities = inputOptions.gameState.parserState?.CurrentEntities;

	const costFromEntity = (eid: number | null | undefined): number => {
		if (eid == null || !entities) {
			return -1;
		}
		const e = entities.get(eid);
		return e ? getEntityTag(e, GameTag.TAG_SCRIPT_DATA_NUM_1, -1) : -1;
	};

	let cost = costFromEntity(entityId);
	if (cost < 0) {
		const deckCard =
			inputOptions.deckState.findCard(entityId)?.card ?? inputOptions.opponentDeckState.findCard(entityId)?.card;
		const fromDeckTags = deckCard?.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1];
		if (fromDeckTags != null && fromDeckTags >= 0) {
			cost = fromDeckTags;
		} else if (deckCard?.creatorEntityId != null) {
			cost = costFromEntity(deckCard.creatorEntityId);
		}
	}

	const refCard = allCards.getCard(SOLDIER_TOKEN_ID);
	const refScript = refCard?.tags?.TAG_SCRIPT_DATA_NUM_1;
	return cost >= 0 ? cost : refScript ?? 2;
}

export const SoldierOfOnyxia: StaticGeneratingCard = {
	cardIds: [SOLDIER_TOKEN_ID],
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const cost = resolveStoredMinionCost(input);
		return filterCards(
			SOLDIER_TOKEN_ID,
			input.allCards,
			(c) => c.cost === cost && hasCorrectType(c, CardType.MINION),
			input.inputOptions,
		);
	},
};
