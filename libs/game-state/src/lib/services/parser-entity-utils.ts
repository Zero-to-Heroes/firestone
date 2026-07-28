import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { FullEntity, ParserGameStateLite } from '@firestone/power-log-parser';

export interface TagLike {
	readonly Name: number;
	readonly Value: number;
}

export interface EntityLike {
	readonly Id: number;
	readonly CardId: string;
	readonly Tags: readonly TagLike[];
}

export interface EnchantmentLike extends EntityLike {
	readonly Tags: readonly TagLike[];
}

/**
 * Prefer public `Tags`. After Electron IPC structured clone the getter is lost and only
 * private `_tags` remains on the plain object — read that as a fallback without naming it
 * on FullEntity (where `_tags` is private and conflicts with a public optional field).
 */
export function getEntityTags(
	entity: { readonly Tags?: readonly TagLike[] | null } | undefined | null,
): readonly TagLike[] | undefined {
	if (!entity) return undefined;
	if (entity.Tags) return entity.Tags;
	return (entity as { _tags?: readonly TagLike[] })._tags;
}

export function getTag(tags: readonly TagLike[] | undefined | null, tag: GameTag | number, defaultValue = -1): number {
	if (!tags) return defaultValue;
	const match = tags.find((t) => t.Name === (tag as number));
	return match == null ? defaultValue : match.Value;
}

export const getTagWithHistory = (entity: FullEntity | undefined | null, tag: GameTag | number): number | null => {
	if (!entity) {
		return null;
	}

	const result = getEntityTags(entity)?.find((t) => t.Name === tag)?.Value;
	if (!!result) {
		return result;
	}

	// Can happen if the entity got transformed, then we look into the past
	// Pick the last one
	const history = entity.TagsHistory.filter((t) => t.Name === tag).pop()?.Value;
	return history ?? null;
};

export function hasTag(tags: readonly TagLike[] | undefined | null, tag: GameTag | number): boolean {
	return getTag(tags, tag) > 0;
}

export function getEntityTag(entity: EntityLike | undefined | null, tag: GameTag | number, defaultValue = -1): number {
	return getTag(getEntityTags(entity), tag, defaultValue);
}

/**
 * Materialize parser entities for Electron IPC. `FullEntity.Tags` is a prototype getter over
 * `_tags`; structured clone drops the getter, which breaks overlay counters that read Tags.
 * Idempotent so it is safe when the facade transform runs on both main and renderer.
 *
 * `dropRemovedFromGame` (Plan D payload diet, docs/electron-memory-investigation.md):
 * in late BG games ~90% of the wire bytes are dead combat minions in REMOVEDFROMGAME
 * (2.09 MB of a 2.86 MB wire value at turn 17, measured on the session 9 log). No
 * renderer-side consumer reads that zone in BG (audited: BG counters read controller
 * entities + PLAY enchantments, highlights/dynamic pools read hovered HAND/PLAY
 * entities; the dead-zone readers — dark-gifts, bashana, godfrey — are
 * constructed-only). Main keeps the raw state either way; only the wire copy shrinks.
 */
export function sanitizeParserStateForElectron(
	parserState: ParserGameStateLite | null | undefined,
	options?: { dropRemovedFromGame?: boolean },
): ParserGameStateLite | undefined {
	if (!parserState) {
		return undefined;
	}
	const controllerEntityMap = parserState.ControllerEntityMap ?? new Map<number, number>();
	const controllerEntityIds = options?.dropRemovedFromGame ? new Set(controllerEntityMap.values()) : null;
	const currentEntities = new Map<number, FullEntity>();
	for (const [id, entity] of parserState.CurrentEntities ?? []) {
		if (
			controllerEntityIds &&
			!controllerEntityIds.has(id) &&
			getTag(getEntityTags(entity), GameTag.ZONE) === (Zone.REMOVEDFROMGAME as number)
		) {
			continue;
		}
		currentEntities.set(id, sanitizeEntityForElectron(entity) as FullEntity);
	}
	return {
		CurrentEntities: currentEntities,
		ControllerEntityMap: controllerEntityMap,
	};
}

function sanitizeEntityForElectron(entity: EntityLike | FullEntity): EntityLike {
	const tags = getEntityTags(entity) ?? [];
	return {
		Id: entity.Id,
		CardId: entity.CardId ?? '',
		Tags: tags.map((t) => ({ Name: t.Name, Value: t.Value })),
	};
}

export function getPlayerEnchantments(
	currentEntities: Map<number, FullEntity> | undefined | null,
	entity: FullEntity | undefined | null,
	enchantment: string,
): FullEntity[] {
	if (!currentEntities || !entity) return [];
	const enchantments = getEnchantmentsForEntity(currentEntities, entity.Id);
	return enchantments.filter((e) => e.CardId === enchantment);
}

export function getEffectiveController(entity: EntityLike | undefined | null): number {
	if (!entity) return -1;
	const lettuceControllerId = getEntityTag(entity, GameTag.LETTUCE_CONTROLLER);
	if (lettuceControllerId !== -1) {
		return lettuceControllerId;
	}
	return getEntityTag(entity, GameTag.CONTROLLER);
}

export function getControllerEntity(
	currentEntities: Map<number, EntityLike> | undefined | null,
	controllerEntityMap: Map<number, number> | undefined | null,
	playerId: number,
): EntityLike | undefined {
	if (!currentEntities || !controllerEntityMap) return undefined;
	const entityId = controllerEntityMap.get(playerId);
	if (entityId == null) return undefined;
	return currentEntities.get(entityId);
}

export function getEntitiesForPlayer(
	currentEntities: Map<number, EntityLike> | undefined | null,
	playerId: number,
): EntityLike[] {
	if (!currentEntities) return [];
	return [...currentEntities.values()].filter((e) => getEffectiveController(e) === playerId);
}

export function getEntitiesInZone(
	currentEntities: Map<number, EntityLike> | undefined | null,
	playerId: number,
	zone: Zone | number,
): EntityLike[] {
	if (!currentEntities) return [];
	return [...currentEntities.values()].filter(
		(e) => getEntityTag(e, GameTag.ZONE) === (zone as number) && getEffectiveController(e) === playerId,
	);
}

export function getBoard(currentEntities: Map<number, EntityLike> | undefined | null, playerId: number): EntityLike[] {
	if (!currentEntities) return [];
	return [...currentEntities.values()]
		.filter(
			(e) =>
				getEntityTag(e, GameTag.ZONE) === (Zone.PLAY as number) &&
				getEffectiveController(e) === playerId &&
				isMinionLike(e),
		)
		.sort((a, b) => getEntityTag(a, GameTag.ZONE_POSITION) - getEntityTag(b, GameTag.ZONE_POSITION));
}

// Hoisted enum values for the getHeroesAndDeckCounts hot loop: `case GameTag.ZONE:` compiles
// to a module-namespace property access per tag per case, which dominated the loop when left
// inline (measured on the full-pipeline perf harness).
const TAG_ZONE: number = GameTag.ZONE;
const TAG_CARDTYPE: number = GameTag.CARDTYPE;
const TAG_CONTROLLER: number = GameTag.CONTROLLER;
const TAG_LETTUCE_CONTROLLER: number = GameTag.LETTUCE_CONTROLLER;
const TAG_ZONE_POSITION: number = GameTag.ZONE_POSITION;
const ZONE_DECK: number = Zone.DECK;
const ZONE_PLAY: number = Zone.PLAY;
const CARD_TYPE_HERO: number = CardType.HERO;

/**
 * Single pass over `currentEntities` computing, for each requested playerId, the in-play hero
 * entity (same selection as {@link getHero}: CARDTYPE=HERO, ZONE=PLAY, lowest ZONE_POSITION,
 * ties by iteration order) and the number of entities in their DECK zone (same as
 * `getEntitiesInZone(..., Zone.DECK).length`).
 *
 * Exists because this runs on every PTL game-state update: `CurrentEntities` holds every
 * entity ever created (thousands late-game in BG), and calling `getHero` +
 * `getEntitiesInZone` per player spread the map and rescanned each entity's Tags array
 * multiple times. Here each entity's Tags are scanned once, for all players at once.
 */
export function getHeroesAndDeckCounts(
	currentEntities: Map<number, EntityLike> | undefined | null,
	playerIds: readonly number[],
): Map<number, { hero: EntityLike | undefined; cardsInDeck: number }> {
	const result = new Map<number, { hero: EntityLike | undefined; cardsInDeck: number }>();
	const bestHeroZonePosition = new Map<number, number>();
	for (const playerId of playerIds) {
		result.set(playerId, { hero: undefined, cardsInDeck: 0 });
	}
	if (!currentEntities) {
		return result;
	}
	for (const entity of currentEntities.values()) {
		// First tag wins for each Name, like getTag's `.find`
		let zone = -1,
			cardType = -1,
			controller = -1,
			lettuceController = -1,
			zonePosition = -1;
		const tags = getEntityTags(entity);
		if (tags) {
			for (let i = 0; i < tags.length; i++) {
				const name = tags[i].Name;
				if (name === TAG_ZONE) {
					if (zone === -1) {
						zone = tags[i].Value;
					}
				} else if (name === TAG_CARDTYPE) {
					if (cardType === -1) {
						cardType = tags[i].Value;
					}
				} else if (name === TAG_CONTROLLER) {
					if (controller === -1) {
						controller = tags[i].Value;
					}
				} else if (name === TAG_LETTUCE_CONTROLLER) {
					if (lettuceController === -1) {
						lettuceController = tags[i].Value;
					}
				} else if (name === TAG_ZONE_POSITION) {
					if (zonePosition === -1) {
						zonePosition = tags[i].Value;
					}
				}
			}
		}
		const effectiveController = lettuceController !== -1 ? lettuceController : controller;
		const entry = result.get(effectiveController);
		if (!entry) {
			continue;
		}
		if (zone === ZONE_DECK) {
			entry.cardsInDeck++;
		}
		if (cardType === CARD_TYPE_HERO && zone === ZONE_PLAY) {
			const best = bestHeroZonePosition.get(effectiveController);
			if (best === undefined || zonePosition < best) {
				entry.hero = entity;
				bestHeroZonePosition.set(effectiveController, zonePosition);
			}
		}
	}
	return result;
}

export function getHero(
	currentEntities: Map<number, EntityLike> | undefined | null,
	playerId: number,
): EntityLike | undefined {
	if (!currentEntities) return undefined;
	return [...currentEntities.values()]
		.filter(
			(e) =>
				getEntityTag(e, GameTag.CARDTYPE) === (CardType.HERO as number) &&
				getEffectiveController(e) === playerId &&
				getEntityTag(e, GameTag.ZONE) === (Zone.PLAY as number),
		)
		.sort((a, b) => getEntityTag(a, GameTag.ZONE_POSITION) - getEntityTag(b, GameTag.ZONE_POSITION))[0];
}

export function isMinionLike(entity: EntityLike | undefined | null): boolean {
	if (!entity) return false;
	const cardType = getEntityTag(entity, GameTag.CARDTYPE);
	return (
		cardType === (CardType.MINION as number) ||
		cardType === (CardType.LOCATION as number) ||
		cardType === (CardType.BATTLEGROUND_SPELL as number)
	);
}

export function getEnchantmentsForEntity(
	currentEntities: Map<number, FullEntity> | undefined | null,
	entityId: number,
): FullEntity[] {
	if (!currentEntities) return [];
	return [...currentEntities.values()].filter(
		(e) =>
			getEntityTag(e, GameTag.ATTACHED) === entityId && getEntityTag(e, GameTag.ZONE) === (Zone.PLAY as number),
	);
}
