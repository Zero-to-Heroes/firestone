import type { BgsHeroPower } from '@firestone-hs/simulate-bgs-battle/dist/bgs-player-entity';

export interface SimulationActionHeroPowerEntry {
	readonly cardId: string;
	readonly entityId: number;
	readonly used: boolean;
	readonly additionalHeroPowerIndex: number;
}

// Keep in sync with getSimulationActionHeroPowerEntries in @firestone/battlegrounds/core
export const getSimulationActionHeroPowerEntries = (
	heroPowerCardId: string | null | undefined,
	heroPowerEntityId: number | null | undefined,
	heroPowerUsed: boolean | null | undefined,
	heroPowers: readonly Pick<BgsHeroPower, 'cardId' | 'entityId' | 'used'>[] | null | undefined,
	defaultPrimaryEntityId: number,
	defaultAdditionalEntityIdStart: number,
): readonly SimulationActionHeroPowerEntry[] => {
	const result: SimulationActionHeroPowerEntry[] = [];
	if (heroPowerCardId) {
		result.push({
			cardId: heroPowerCardId,
			entityId: heroPowerEntityId ?? defaultPrimaryEntityId,
			used: heroPowerUsed ?? false,
			additionalHeroPowerIndex: 0,
		});
	}

	for (const [index, heroPower] of (heroPowers ?? []).slice(1).entries()) {
		if (!heroPower?.cardId) {
			continue;
		}
		result.push({
			cardId: heroPower.cardId,
			entityId: heroPower.entityId || defaultAdditionalEntityIdStart + index,
			used: heroPower.used ?? false,
			additionalHeroPowerIndex: index + 1,
		});
	}

	return result;
};
