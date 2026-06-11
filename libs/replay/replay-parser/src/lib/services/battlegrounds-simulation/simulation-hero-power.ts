import { GameTag, TrinketSlot } from '@firestone-hs/reference-data';
import type { BgsHeroPower } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';

export interface BgsTrinketLike {
	readonly cardId?: string;
	readonly entityId?: number;
	readonly scriptDataNum6?: number;
	readonly tags?: Record<string, number>;
}

export interface SimulationActionHeroPowerEntry {
	readonly cardId: string;
	readonly entityId: number;
	readonly used: boolean;
	readonly additionalHeroPowerIndex: number;
}

const mergeBgsHeroPowerCardIds = (
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

// Keep in sync with @firestone/battlegrounds/core bgs-hero-power-zone.ts
const getTrinketAdditionalHeroPowerIndex = (trinket: BgsTrinketLike): number =>
	trinket.tags?.[GameTag.ADDITIONAL_HERO_POWER_INDEX] ?? -1;

const resolveTrinketHeroPowerCardId = (trinkets: readonly BgsTrinketLike[] | null | undefined): string | null => {
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

const resolveAdditionalTrinketHeroPowerCardId = (
	trinkets: readonly BgsTrinketLike[] | null | undefined,
): string | null => {
	if (!trinkets?.length) {
		return null;
	}

	const slot3Trinket = trinkets.find((trinket) => trinket.scriptDataNum6 === TrinketSlot.HERO_POWER);
	if (!slot3Trinket?.cardId) {
		return null;
	}
	if (getTrinketAdditionalHeroPowerIndex(slot3Trinket) === 1) {
		return slot3Trinket.cardId;
	}

	const regularTrinketCardIds = new Set(
		trinkets
			.filter((trinket) => trinket.scriptDataNum6 !== TrinketSlot.HERO_POWER && !!trinket.cardId)
			.map((trinket) => trinket.cardId as string),
	);
	if (regularTrinketCardIds.has(slot3Trinket.cardId)) {
		return slot3Trinket.cardId;
	}

	return null;
};

const resolveSimulationHeroPowerCardIds = (input: {
	readonly heroPowers?: readonly Pick<BgsHeroPower, 'cardId'>[] | null;
	readonly trinkets?: readonly BgsTrinketLike[] | null;
	readonly heroPowerId?: string | null;
	readonly questRewardHeroPowerCardId?: string | null;
}): readonly string[] => {
	const trinketHeroPower = resolveTrinketHeroPowerCardId(input.trinkets);
	if (trinketHeroPower) {
		return [trinketHeroPower];
	}

	const heroPowerCardIds =
		input.heroPowers?.map((heroPower) => heroPower.cardId).filter((cardId): cardId is string => !!cardId) ?? [];
	if (heroPowerCardIds.length >= 2) {
		return heroPowerCardIds.slice(0, 2);
	}

	const additionalTrinketHeroPower = resolveAdditionalTrinketHeroPowerCardId(input.trinkets);
	if (additionalTrinketHeroPower) {
		return mergeBgsHeroPowerCardIds(heroPowerCardIds, additionalTrinketHeroPower);
	}

	if (heroPowerCardIds.length >= 1) {
		return mergeBgsHeroPowerCardIds(input.heroPowerId, heroPowerCardIds);
	}

	if (input.questRewardHeroPowerCardId) {
		return [input.questRewardHeroPowerCardId];
	}

	return mergeBgsHeroPowerCardIds(input.heroPowerId, heroPowerCardIds);
};

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
