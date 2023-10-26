import { Injectable } from '@angular/core';
import { VillageVisitorType } from '@firestone-hs/reference-data';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	DiskCacheService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { distinctUntilChanged, map } from 'rxjs';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

const MERCENARIES_REFERENCE_DATA = 'https://static.zerotoheroes.com/hearthstone/data/mercenaries';

@Injectable()
export class MercenariesReferenceDataService extends AbstractFacadeService<MercenariesReferenceDataService> {
	public referenceData$$: SubscriberAwareBehaviorSubject<MercenariesReferenceData | null>;

	private api: ApiRunner;
	private store: AppUiStoreFacadeService;
	private diskCache: DiskCacheService;

	constructor(protected readonly windowManager: WindowManagerService) {
		super(windowManager, 'mercenariesReferenceData', () => !!this.referenceData$$);
	}

	protected override assignSubjects() {
		this.referenceData$$ = this.mainInstance.referenceData$$;
	}

	protected async init() {
		this.referenceData$$ = new SubscriberAwareBehaviorSubject<MercenariesReferenceData | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.store = AppInjector.get(AppUiStoreFacadeService);
		this.diskCache = AppInjector.get(DiskCacheService);

		await this.store.initComplete();

		this.referenceData$$.onFirstSubscribe(async () => {
			this.store
				.listenPrefs$((prefs) => prefs.locale)
				.pipe(
					map(([locale]) => [locale]),
					distinctUntilChanged(),
				)
				.subscribe(async ([locale]) => {
					this.loadReferenceData(locale);
				});
		});
	}

	private async loadReferenceData(locale: string) {
		console.log('[mercenaries-state-builder] loading reference data');
		const localInfo = await this.diskCache.getItem<MercenariesReferenceData>(
			DiskCacheService.DISK_CACHE_KEYS.MERCENARIES_REFERENCE_DATA,
		);
		if (!!localInfo?.mercenaries?.length) {
			console.log('loaded local mercenaries ref data');
			this.referenceData$$.next(localInfo);
		}

		const referenceData = await this.api.callGetApi<MercenariesReferenceData>(
			`${MERCENARIES_REFERENCE_DATA}/mercenaries-data_${locale}.json`,
		);
		await this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.MERCENARIES_REFERENCE_DATA, referenceData);
		this.referenceData$$.next(referenceData);
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
