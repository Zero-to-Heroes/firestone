/* eslint-disable @typescript-eslint/no-use-before-define */
import { EventEmitter, Injectable } from '@angular/core';
import { MercenariesState } from '../../models/mercenaries/mercenaries-state';
import { MercenariesCategoryId } from '../../models/mercenaries/mercenary-category-id.type';
import { ApiRunner } from '../api-runner';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';

const MERCENARIES_DATA = 'https://static.zerotoheroes.com/hearthstone/data/mercenaries-data.json?v=3';
const MERCENARIES_GLOBAL_STATS = 'https://static.zerotoheroes.com/api/mercenaries-global-stats.gz.json?v=7';

@Injectable()
export class MercenariesStateBuilderService {
	private mainWindowStateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly api: ApiRunner,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
	) {
		setTimeout(() => {
			this.mainWindowStateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async loadReferenceData(): Promise<MercenariesReferenceData> {
		const referenceData = await this.api.callGetApi<MercenariesReferenceData>(MERCENARIES_DATA);
		console.debug('[merc-init] referenceData', referenceData);
		return referenceData;
	}

	public async loadGlobalStats(): Promise<MercenariesGlobalStats> {
		const globalStats = await this.api.callGetApi<MercenariesGlobalStats>(MERCENARIES_GLOBAL_STATS);
		console.debug('[merc-init] globalStats', globalStats);
		return globalStats;
	}

	public initState(globalStats: MercenariesGlobalStats, referenceData: MercenariesReferenceData): MercenariesState {
		const categoryIds: readonly MercenariesCategoryId[] = [
			'mercenaries-hero-stats',
			'mercenaries-compositions-stats',
		];
		return MercenariesState.create({
			globalStats: globalStats,
			referenceData: referenceData,
			categoryIds: categoryIds,
			loading: false,
		} as MercenariesState);
	}
}

export interface MercenariesReferenceData {
	readonly mercenaries: readonly {
		readonly id: number;
		readonly cardDbfId: number;
		readonly name: string;
		readonly specializationId: number;
		readonly specializationName: string;
		readonly abilities: readonly {
			readonly abilityId: number;
			readonly cardDbfId: number;
			readonly mercenaryRequiredLevel: number;
			readonly tiers: readonly {
				readonly tier: number;
				readonly cardDbfId: number;
				readonly coinCraftCost: number;
			}[];
		}[];
		readonly equipments: readonly {
			readonly equipmentId: number;
			readonly cardDbfId: number;
			readonly tiers: readonly {
				readonly tier: number;
				readonly cardDbfId: number;
				readonly coinCraftCost: number;
				readonly attackModifier: number;
				readonly healthModifier: number;
			}[];
		}[];
	}[];
	readonly mercenaryLevels: readonly {
		readonly currentLevel: number;
		readonly xpToNext: number;
	}[];
	readonly bountySets: readonly {
		readonly id: number;
		readonly name: string;
		readonly descriptionNormal: string;
		readonly descriptionHeroic: string;
		readonly descriptionLegendary: string;
		readonly sortOrder: number;
		readonly bounties: readonly {
			readonly id: number;
			readonly name: string;
			readonly level: number;
			readonly enabled: number;
			readonly difficultyMode: number;
			readonly heroic: number;
			readonly finalBossCardId: number;
			readonly sortOrder: number;
			readonly requiredCompletedBountyId: number;
			readonly rewardMercenaryIds: readonly number[];
		}[];
	}[];
}

export interface MercenariesGlobalStats {
	readonly lastUpdateDate: Date;
	readonly pve: MercenariesGlobalStatsPve;
	readonly pvp: MercenariesGlobalStatsPvp;
}

export interface MercenariesGlobalStatsPve {
	// Uses difficulty instead of MMR percentile
	readonly heroStats: readonly MercenariesHeroStat[];
	readonly compositions: readonly MercenariesComposition[];
	// treasures: readonly MercenariesTreasureStat[];
}

export interface MercenariesGlobalStatsPvp {
	readonly mmrPercentiles: readonly MmrPercentile[];
	readonly heroStats: readonly MercenariesHeroStat[];
	readonly compositions: readonly MercenariesComposition[];
}

export interface MercenariesComposition {
	readonly stringifiedHeroes: string;
	readonly date: 'all-time' | 'past-seven' | 'past-three' | 'last-patch';
	readonly heroCardIds: readonly string[];
	readonly mmrPercentile: 100 | 50 | 25 | 10 | 1 | 'normal' | 'heroic' | 'legendary';
	readonly totalMatches: number;
	readonly totalWins: number;
	readonly totalLosses: number;
	readonly benches: readonly MercenariesCompositionBench[];
}

export interface MercenariesCompositionBench {
	readonly heroCardIds: readonly string[];
	readonly totalMatches: number;
	readonly totalWins: number;
	readonly totalLosses: number;
}

export interface MercenariesHeroStat {
	readonly date: 'all-time' | 'past-seven' | 'past-three' | 'last-patch';
	// All card IDs normalize for skin
	readonly heroCardId: string;
	readonly heroRole: 'caster' | 'fighter' | 'protector';
	readonly equipementCardId: string;
	readonly starter: boolean;
	// Levels are grouped by range of 5?
	readonly heroLevel: Level;
	readonly equipmentLevel: Level;
	readonly skillInfos: readonly SkillInfo[];
	readonly mmrPercentile: 100 | 50 | 25 | 10 | 1 | 'normal' | 'heroic' | 'legendary';
	readonly totalMatches: number;
	readonly totalWins: number;
	readonly totalLosses: number;
}

export interface SkillInfo {
	readonly cardId: string;
	// If skill level is 0, or number is null, this means the skill wasn't available in the match
	// (usually means it's not unlocked yet)
	// readonly level: Level;
	readonly numberOfTimesUsed: number;
	readonly numberOfMatches: number;
}
export interface MmrPercentile {
	readonly mmr: number;
	readonly percentile: 100 | 50 | 25 | 10 | 1;
}

export type Level = null | 1 | 5 | 10 | 15 | 20 | 25 | 30;
