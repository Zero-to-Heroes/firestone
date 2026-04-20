import { GameTag } from '@firestone-hs/reference-data';
import { DeckCard } from '../../models/deck-card';
import { EntityLike, getEntityTag } from '../parser-entity-utils';
import { StaticGeneratingCardInput } from './_card.type';

/**
 * Some tokens (Herald upgrades, Soldier of Onyxia, Onyxia's Wing) store a random minion mana cost in
 * {@link GameTag.TAG_SCRIPT_DATA_NUM_1}. The power log may first SHOW_ENTITY with the correct value,
 * then a later TAG_CHANGE overwrites tag 479 on the parser entity with a lower value; the deck card
 * can still carry the higher ScriptData from the show block.
 */
export function resolveScriptDataNum1FromEntityAndDeck(
	entityId: number | null | undefined,
	deckCard: DeckCard | undefined,
	entities: Map<number, EntityLike> | undefined | null,
): number {
	const tag = GameTag.TAG_SCRIPT_DATA_NUM_1;
	const fromEntity =
		entityId != null && entities ? getEntityTag(entities.get(entityId), tag, -1) : -1;
	const fromDeckRaw = deckCard?.tags?.[tag];
	const fromDeck = fromDeckRaw != null && fromDeckRaw >= 0 ? fromDeckRaw : -1;

	if (fromEntity >= 0 && fromDeck >= 0) {
		return Math.max(fromEntity, fromDeck);
	}
	if (fromDeck >= 0) {
		return fromDeck;
	}
	if (fromEntity >= 0) {
		return fromEntity;
	}
	return -1;
}

export type StoredRandomMinionCostOptions = {
	/**
	 * When true (Soldier of Onyxia), if script data is still missing, read the creator entity.
	 * When false (Onyxia's Wing), do not — the creator is often Arisen Onyxia, whose TAG_SCRIPT_DATA_NUM_1
	 * is unrelated to the wing pool.
	 */
	readonly useCreatorEntityFallback?: boolean;
};

export function resolveStoredRandomMinionCost(
	input: StaticGeneratingCardInput,
	referenceCardIdForFallback: string,
	options?: StoredRandomMinionCostOptions,
): number {
	const { entityId, allCards, inputOptions } = input;
	const entities = inputOptions.gameState.parserState?.CurrentEntities;
	const deckCard =
		inputOptions.deckState.findCard(entityId)?.card ?? inputOptions.opponentDeckState.findCard(entityId)?.card;

	const costFromEntity = (eid: number | null | undefined): number => {
		if (eid == null || !entities) {
			return -1;
		}
		const e = entities.get(eid);
		return e ? getEntityTag(e, GameTag.TAG_SCRIPT_DATA_NUM_1, -1) : -1;
	};

	let cost = resolveScriptDataNum1FromEntityAndDeck(entityId, deckCard, entities);
	const useCreator = options?.useCreatorEntityFallback !== false;
	if (cost < 0 && useCreator && deckCard?.creatorEntityId != null) {
		cost = costFromEntity(deckCard.creatorEntityId);
	}

	const refCard = allCards.getCard(referenceCardIdForFallback);
	const refScript = refCard?.tags?.TAG_SCRIPT_DATA_NUM_1;
	return cost >= 0 ? cost : refScript ?? 2;
}
