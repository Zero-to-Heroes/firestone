import { CardType, GameTag, TrinketSlot, Zone } from '@firestone-hs/reference-data';
import type { BgsHeroPower, BgsPlayerEntity } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';

export interface BgsHeroPowerEntityLike {
	getTag(tag: GameTag): number;
	getCardType(): number;
	getZone(): number;
	cardID?: string;
	getCardId?(): string;
}

const getEntityCardId = (entity: BgsHeroPowerEntityLike): string => entity.getCardId?.() ?? entity.cardID ?? '';

export interface BgsTrinketLike {
	readonly cardId?: string;
	readonly entityId?: number;
	readonly scriptDataNum6?: number;
	readonly tags?: Partial<Record<GameTag, number>> | Record<string, number>;
}

const getTrinketAdditionalHeroPowerIndex = (trinket: BgsTrinketLike): number =>
	trinket.tags?.[GameTag.ADDITIONAL_HERO_POWER_INDEX] ?? -1;

export const resolveTrinketHeroPowerCardId = (
	trinkets: readonly BgsTrinketLike[] | null | undefined,
): string | null => {
	if (!trinkets?.length) {
		return null;
	}

	const regularTrinketCardIds = new Set(
		trinkets
			.filter((trinket) => trinket.scriptDataNum6 !== TrinketSlot.HERO_POWER && !!trinket.cardId)
			.map((trinket) => trinket.cardId as string),
	);
	const slot3Trinket = trinkets.find((trinket) => trinket.scriptDataNum6 === TrinketSlot.HERO_POWER);
	if (!slot3Trinket?.cardId) {
		return null;
	}
	if (getTrinketAdditionalHeroPowerIndex(slot3Trinket) === 1) {
		return null;
	}
	if (regularTrinketCardIds.has(slot3Trinket.cardId)) {
		return null;
	}
	return slot3Trinket.cardId;
};

const isValidTrinketHeroPowerEntity = (
	entity: BgsHeroPowerEntityLike,
	regularTrinketCardIds: ReadonlySet<string>,
): boolean => {
	if (entity.getCardType() !== CardType.BATTLEGROUND_TRINKET) {
		return false;
	}
	if (entity.getTag(GameTag.TAG_SCRIPT_DATA_NUM_6) !== TrinketSlot.HERO_POWER) {
		return false;
	}
	if (entity.getTag(GameTag.ADDITIONAL_HERO_POWER_INDEX) === 1) {
		return false;
	}
	const cardId = getEntityCardId(entity);
	return !!cardId && !regularTrinketCardIds.has(cardId);
};

export const resolveSimulationHeroPowerCardIds = (input: {
	readonly heroPowers?: readonly Pick<BgsHeroPower, 'cardId'>[] | null;
	readonly trinkets?: readonly BgsTrinketLike[] | null;
	readonly heroPowerId?: string | null;
	readonly questRewardHeroPowerCardId?: string | null;
}): readonly string[] => {
	const trinketHeroPower = resolveTrinketHeroPowerCardId(input.trinkets);
	if (trinketHeroPower) {
		return [trinketHeroPower];
	}
	if (input.questRewardHeroPowerCardId) {
		return [input.questRewardHeroPowerCardId];
	}

	const heroPowerCardIds =
		input.heroPowers?.map((heroPower) => heroPower.cardId).filter((cardId): cardId is string => !!cardId) ?? [];
	if (heroPowerCardIds.length >= 2) {
		return heroPowerCardIds.slice(0, 2);
	}

	return mergeBgsHeroPowerCardIds(input.heroPowerId, heroPowerCardIds);
};

export const adaptReplayHeroPowerEntity = (entity: {
	cardID: string;
	getTag(tag: GameTag): number;
	getCardType(): number;
	getZone(): number;
}): BgsHeroPowerEntityLike => ({
	getTag: (tag) => entity.getTag(tag),
	getCardType: () => entity.getCardType(),
	getZone: () => entity.getZone(),
	getCardId: () => entity.cardID,
});

export const adaptParserHeroPowerEntity = (entity: {
	CardId: string;
	GetTag(tag: GameTag, defaultValue?: number): number;
	GetCardType(): number;
}): BgsHeroPowerEntityLike => ({
	getTag: (tag) => entity.GetTag(tag, -1),
	getCardType: () => entity.GetCardType(),
	getZone: () => entity.GetTag(GameTag.ZONE, -1),
	getCardId: () => entity.CardId,
});

export const resolveBgsHeroPowerEntities = <T extends BgsHeroPowerEntityLike>(
	entities: readonly T[],
	playerId: number,
): readonly T[] => {
	if (!entities?.length || !playerId) {
		return [];
	}

	const playerPlayEntities = entities.filter(
		(entity) => entity.getTag(GameTag.CONTROLLER) === playerId && entity.getZone() === Zone.PLAY,
	);

	const regularTrinketCardIds = new Set(
		playerPlayEntities
			.filter(
				(entity) =>
					entity.getCardType() === CardType.BATTLEGROUND_TRINKET &&
					entity.getTag(GameTag.TAG_SCRIPT_DATA_NUM_6) !== TrinketSlot.HERO_POWER,
			)
			.map((entity) => getEntityCardId(entity))
			.filter((cardId): cardId is string => !!cardId),
	);
	const trinketHeroPower = playerPlayEntities.find((entity) =>
		isValidTrinketHeroPowerEntity(entity, regularTrinketCardIds),
	);
	if (trinketHeroPower) {
		return [trinketHeroPower];
	}

	const questHeroPowerRewards = playerPlayEntities.filter(
		(entity) =>
			entity.getCardType() === CardType.BATTLEGROUND_QUEST_REWARD &&
			entity.getTag(GameTag.BACON_IS_HEROPOWER_QUESTREWARD) === 1,
	);
	if (questHeroPowerRewards.length) {
		return questHeroPowerRewards;
	}

	return playerPlayEntities
		.filter((entity) => entity.getCardType() === CardType.HERO_POWER)
		.sort(
			(a, b) =>
				(a.getTag(GameTag.ADDITIONAL_HERO_POWER_INDEX) || 0) -
				(b.getTag(GameTag.ADDITIONAL_HERO_POWER_INDEX) || 0),
		);
};

export const resolveBgsHeroPowerCardIds = (
	entities: readonly BgsHeroPowerEntityLike[],
	playerId: number,
): readonly string[] =>
	resolveBgsHeroPowerEntities(entities, playerId)
		.map((entity) => getEntityCardId(entity))
		.filter((cardId): cardId is string => !!cardId);

export const isBgsQuestRewardEntity = (entity: BgsHeroPowerEntityLike): boolean =>
	entity.getTag(GameTag.CARDTYPE) === CardType.BATTLEGROUND_QUEST_REWARD &&
	entity.getTag(GameTag.BACON_IS_HEROPOWER_QUESTREWARD) !== 1;

export const mergeBgsHeroPowerCardIds = (
	...sources: (readonly string[] | string | null | undefined)[]
): readonly string[] => {
	const result: string[] = [];
	for (const source of sources) {
		if (!source) {
			continue;
		}
		const cardIds = Array.isArray(source) ? source : [source];
		for (const cardId of cardIds) {
			if (cardId && !result.includes(cardId)) {
				result.push(cardId);
			}
		}
	}
	return result;
};

export const buildBgsHeroPower = (cardId: string, info = 0): BgsHeroPower => ({
	cardId,
	entityId: 0,
	used: false,
	info,
	info2: 0,
	info3: 0,
	info4: 0,
	info5: 0,
	info6: 0,
});

export const getSimulatorHeroPowerCardIds = (
	player: Pick<BgsPlayerEntity, 'heroPowerId' | 'heroPowers' | 'trinkets'> | null | undefined,
): readonly string[] => {
	if (!player) {
		return [];
	}

	return resolveSimulationHeroPowerCardIds({
		heroPowers: player.heroPowers,
		trinkets: player.trinkets,
		heroPowerId: player.heroPowerId,
	});
};

// Also duplicated in replay-parser/simulation-hero-power.ts to avoid a circular dependency with battlegrounds/core.
export interface SimulationActionHeroPowerEntry {
	readonly cardId: string;
	readonly entityId: number;
	readonly used: boolean;
	readonly additionalHeroPowerIndex: number;
}

export const getSimulationActionHeroPowerEntries = (
	heroPowerCardId: string | null | undefined,
	heroPowerEntityId: number | null | undefined,
	heroPowerUsed: boolean | null | undefined,
	heroPowers: readonly Pick<BgsHeroPower, 'cardId' | 'entityId' | 'used'>[] | null | undefined,
	trinkets: readonly BgsTrinketLike[] | null | undefined,
	questRewardHeroPowerCardId: string | null | undefined,
	defaultPrimaryEntityId: number,
	defaultAdditionalEntityIdStart: number,
): readonly SimulationActionHeroPowerEntry[] => {
	const cardIds = resolveSimulationHeroPowerCardIds({
		heroPowers,
		trinkets,
		questRewardHeroPowerCardId,
	});

	return cardIds.map((cardId, index) => {
		const trinketMatch = trinkets?.find(
			(trinket) => trinket.cardId === cardId && trinket.scriptDataNum6 === TrinketSlot.HERO_POWER,
		);
		const heroPowerMatch = heroPowers?.find((heroPower) => heroPower.cardId === cardId);
		return {
			cardId,
			entityId:
				trinketMatch?.entityId ??
				heroPowerMatch?.entityId ??
				(index === 0 ? defaultPrimaryEntityId : defaultAdditionalEntityIdStart + index - 1),
			used: heroPowerMatch?.used ?? (index === 0 ? heroPowerUsed ?? false : false),
			additionalHeroPowerIndex: index,
		};
	});
};

export const applySimulatorHeroPowerUpdate = (
	player: BgsPlayerEntity,
	heroPowerIndex: number,
	heroPowerCardId: string | null,
	heroPowerInfo: number,
): BgsPlayerEntity => {
	if (heroPowerIndex === 0) {
		return {
			...player,
			heroPowerId: heroPowerCardId,
			heroPowerInfo: heroPowerInfo,
		};
	}

	const heroPowers = [...(player.heroPowers ?? [])];
	if (!heroPowerCardId) {
		return {
			...player,
			heroPowerInfo2: 0,
			heroPowers: heroPowers.length > 1 ? [heroPowers[0]] : [],
		};
	}

	const updatedSecondary = buildBgsHeroPower(heroPowerCardId, heroPowerInfo);
	if (heroPowers.length < 2) {
		if (heroPowers.length === 0 && player.heroPowerId) {
			heroPowers.push(buildBgsHeroPower(player.heroPowerId, +(player.heroPowerInfo ?? 0)));
		}
		heroPowers.push(updatedSecondary);
	} else {
		heroPowers[1] = updatedSecondary;
	}

	return {
		...player,
		heroPowerInfo2: heroPowerInfo,
		heroPowers,
	};
};
