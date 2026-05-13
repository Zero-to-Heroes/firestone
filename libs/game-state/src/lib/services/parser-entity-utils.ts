import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { FullEntity } from '@firestone/power-log-parser';

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

export function getTag(tags: readonly TagLike[] | undefined | null, tag: GameTag | number, defaultValue = -1): number {
	if (!tags) return defaultValue;
	const match = tags.find((t) => t.Name === (tag as number));
	return match == null ? defaultValue : match.Value;
}

export const getTagWithHistory = (entity: FullEntity | undefined | null, tag: GameTag | number): number | null => {
	if (!entity) {
		return null;
	}

	const result = entity.Tags?.find((t) => t.Name === tag)?.Value;
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
	return getTag(entity?.Tags, tag, defaultValue);
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
