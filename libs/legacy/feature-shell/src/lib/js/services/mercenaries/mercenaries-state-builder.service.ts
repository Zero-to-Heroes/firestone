/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { VillageVisitorType } from '@firestone-hs/reference-data';
import { DiskCacheService, LocalStorageService } from '@firestone/shared/framework/core';
import { PreferencesService } from '@services/preferences.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { MemoryMercenariesCollectionInfo } from '../../models/memory/memory-mercenaries-collection-info';
import { MercenariesState } from '../../models/mercenaries/mercenaries-state';
import { MercenariesCategoryId } from '../../models/mercenaries/mercenary-category-id.type';
import { ApiRunner } from '../api-runner';
import { MercenariesGlobalStatsLoadedEvent } from '../mainwindow/store/events/mercenaries/mercenaries-global-stats-loaded-event';
import { MercenariesReferenceDataLoadedEvent } from '../mainwindow/store/events/mercenaries/mercenaries-reference-data-loaded-event';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

const MERCENARIES_REFERENCE_DATA = 'https://static.zerotoheroes.com/hearthstone/data/mercenaries';
const MERCENARIES_GLOBAL_STATS = 'https://static.zerotoheroes.com/api/mercenaries-global-stats-no-bench.gz.json?v=3';

@Injectable()
export class MercenariesStateBuilderService {
	private requestedInitialRefDataLoad = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly api: ApiRunner,
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreFacadeService,
		private readonly localStorage: LocalStorageService,
		private readonly diskCache: DiskCacheService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		combineLatest(
			this.store.listenPrefs$((prefs) => prefs.locale),
			this.requestedInitialRefDataLoad.asObservable(),
		)
			.pipe(
				filter(([[locale], load]) => load),
				map(([[locale], load]) => ({ locale })),
			)
			.subscribe(({ locale }) => this.loadReferenceData(locale));
	}

	public async loadInitialGlobalStats() {
		const localInfo = this.localStorage.getItem<MercenariesGlobalStats>(
			LocalStorageService.MERCENARIES_GLOBAL_STATS,
		);
		if (!!localInfo) {
			this.store.send(new MercenariesGlobalStatsLoadedEvent(localInfo));
		}

		const globalStats = await this.api.callGetApi<MercenariesGlobalStats>(MERCENARIES_GLOBAL_STATS);
		this.localStorage.setItem(LocalStorageService.MERCENARIES_GLOBAL_STATS, globalStats);
		this.store.send(new MercenariesGlobalStatsLoadedEvent(globalStats));
	}

	public loadInitialReferenceData() {
		this.requestedInitialRefDataLoad.next(true);
	}

	public async loadReferenceData(locale?: string) {
		const localInfo = await this.diskCache.getItem<MercenariesReferenceData>(
			DiskCacheService.MERCENARIES_REFERENCE_DATA,
		);
		if (!!localInfo?.mercenaries?.length) {
			console.log('loaded local mercenaries ref data');
			this.store.send(new MercenariesReferenceDataLoadedEvent(localInfo));
		}

		locale = locale ?? (await this.prefs.getPreferences()).locale;
		const referenceData = await this.api.callGetApi<MercenariesReferenceData>(
			`${MERCENARIES_REFERENCE_DATA}/mercenaries-data_${locale}.json`,
		);
		await this.diskCache.storeItem(DiskCacheService.MERCENARIES_REFERENCE_DATA, referenceData);
		console.log('loaded remote mercenaries ref data');
		this.store.send(new MercenariesReferenceDataLoadedEvent(referenceData));
		return referenceData;
	}

	public initState(
		currentState: MercenariesState,
		// globalStats: MercenariesGlobalStats,
		// referenceData: MercenariesReferenceData,
		mercenariesCollection: MemoryMercenariesCollectionInfo,
	): MercenariesState {
		const categoryIds: readonly MercenariesCategoryId[] = [
			'mercenaries-personal-hero-stats',
			'mercenaries-my-teams',
			// Barely used for now
			// 'mercenaries-hero-stats',
			// 'mercenaries-compositions-stats',
		];
		return currentState.update({
			// globalStats: globalStats,
			// referenceData: referenceData,
			collectionInfo: mercenariesCollection,
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
		readonly skins: readonly {
			readonly artVariationId: number;
			readonly cardId: number;
			readonly isDefaultVariation: boolean;
		}[];
		readonly stats: readonly {
			readonly level: number;
			readonly health: number;
			readonly attack: number;
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
		readonly descriptionMythic: string;
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
	readonly taskChains: readonly {
		readonly id: number;
		readonly mercenaryId: number;
		// There is a 1-1 mapping between visitors and mercs
		readonly mercenaryVisitorId: number;
		readonly taskChainType: VillageVisitorType;
		readonly tasks: readonly InternalTask[];
	}[];
	readonly repeatableTasks: readonly InternalTask[];
	readonly mercenaryTreasures: readonly {
		readonly id: number;
		readonly cardId: number;
	}[];
}

export interface InternalTask {
	readonly id: number;
	readonly mercenaryOverrideId: number;
	readonly title: string;
	readonly quota: number;
	readonly description: string;
	readonly rewards: readonly {
		type: number;
		quantity: number;
		mercenarySelector: number;
		equipmentDbfId: number;
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
