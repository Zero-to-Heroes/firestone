import { Injectable } from '@angular/core';
import { ArenaClassMatchup, ArenaClassStat, ArenaClassStats, WinsDistribution } from '@firestone-hs/arena-stats';
import { ALL_CLASSES } from '@firestone-hs/reference-data';
import { ArenaModeFilterType, PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';

const ARENA_CLASS_STATS_URL = `https://static.zerotoheroes.com/api/arena/stats/classes/%modeFilter%/%timePeriod%/overview.gz.json?v=4`;

@Injectable()
export class ArenaClassStatsService extends AbstractFacadeService<ArenaClassStatsService> {
	public classStats$$: SubscriberAwareBehaviorSubject<ArenaClassStats | null | undefined>;
	public classStatsRaw$$: SubscriberAwareBehaviorSubject<ArenaClassStats | null | undefined>;

	private api: ApiRunner;
	private prefs: PreferencesService;

	private internalSub$$ = new SubscriberAwareBehaviorSubject<null>(null);

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaClassStatsService', () => !!this.classStats$$);
	}

	protected override assignSubjects() {
		this.classStats$$ = this.mainInstance.classStats$$;
		this.classStatsRaw$$ = this.mainInstance.classStatsRaw$$;
	}

	protected async init() {
		this.classStats$$ = new SubscriberAwareBehaviorSubject<ArenaClassStats | null | undefined>(null);
		this.classStatsRaw$$ = new SubscriberAwareBehaviorSubject<ArenaClassStats | null | undefined>(null);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);

		this.classStats$$.onFirstSubscribe(() => {
			this.internalSub$$.subscribe();
		});
		this.classStatsRaw$$.onFirstSubscribe(() => {
			this.internalSub$$.subscribe();
		});

		this.internalSub$$.onFirstSubscribe(async () => {
			await waitForReady(this.prefs);

			combineLatest([
				this.prefs.preferences$$.pipe(
					map((prefs) => prefs.arenaActiveTimeFilter),
					distinctUntilChanged(),
				),
				this.prefs.preferences$$.pipe(
					map((prefs) => prefs.arenaActiveMode),
					distinctUntilChanged(),
				),
			]).subscribe(async ([timeFilter, modeFilter]) => {
				const timePeriod =
					timeFilter === 'all-time'
						? 'past-20'
						: timeFilter === 'past-seven'
							? 'past-7'
							: timeFilter === 'past-three'
								? 'past-3'
								: timeFilter;
				const rawResult: ArenaClassStats | null = await this.buildClassStats(timePeriod, modeFilter);
				console.debug('[arena-class-stats] loaded class stats', rawResult);
				this.classStatsRaw$$.next(rawResult);
				this.classStats$$.next(consolidateByPlayerClass(rawResult));
			});
		});
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.classStats$$ = new SubscriberAwareBehaviorSubject<ArenaClassStats | null | undefined>(null);
		this.classStatsRaw$$ = new SubscriberAwareBehaviorSubject<ArenaClassStats | null | undefined>(null);
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.classStats$$, 'ArenaClassStatsService-classStats');
		this.setupElectronSubject(this.classStatsRaw$$, 'ArenaClassStatsService-classStatsRaw');
	}

	public async buildClassStats(timePeriod: string, modeFilter: ArenaModeFilterType): Promise<ArenaClassStats | null> {
		return this.mainInstance.buildClassStatsInternal(timePeriod, modeFilter);
	}

	private async buildClassStatsInternal(
		timePeriod: string,
		modeFilter: ArenaModeFilterType,
	): Promise<ArenaClassStats | null> {
		const modeFilterCorrected = modeFilter === 'arena-legacy' ? 'all' : modeFilter;
		const url = ARENA_CLASS_STATS_URL.replace('%timePeriod%', timePeriod).replace(
			'%modeFilter%',
			modeFilterCorrected,
		);
		const result: ArenaClassStats | null = await this.api.callGetApi(url);
		console.debug('[arena-class-stats] loaded class stats from url', url, result);
		if (!result?.stats?.length) {
			return null;
		}
		return result;
	}
}

const consolidateByPlayerClass = (raw: ArenaClassStats | null | undefined): ArenaClassStats | null | undefined => {
	if (!raw) {
		return raw;
	}
	if (!raw.stats?.length) {
		return null;
	}

	const consolidatedByPlayerClass: ArenaClassStat[] = [];
	for (const playerClass of ALL_CLASSES) {
		const playerClassStats: readonly ArenaClassStat[] =
			raw.stats.filter((s) => s.playerClass?.toUpperCase() === playerClass.toUpperCase()) ?? [];
		if (!playerClassStats.length) {
			continue;
		}

		const mergedStats = mergeForPlayerClass(playerClassStats);
		consolidatedByPlayerClass.push(mergedStats);
	}
	return {
		...raw,
		stats: consolidatedByPlayerClass,
	};
};

const mergeForPlayerClass = (playerClassStats: readonly ArenaClassStat[]): ArenaClassStat => {
	const ref = playerClassStats[0];
	const mergedStats: ArenaClassStat = {
		playerClass: ref.playerClass,
		playerHeroPower: ref.playerHeroPower,
		totalGames: playerClassStats.reduce((acc, curr) => acc + curr.totalGames, 0),
		totalsWins: playerClassStats.reduce((acc, curr) => acc + curr.totalsWins, 0),
		winsDistribution: mergeWinsDistribution(playerClassStats.flatMap((s) => s.winsDistribution)),
		matchups: mergeMatchups(playerClassStats.flatMap((s) => s.matchups)),
	};
	return mergedStats;
};

const mergeWinsDistribution = (winsDistributions: readonly WinsDistribution[]): WinsDistribution[] => {
	const result: WinsDistribution[] = [];
	for (const winsDistribution of winsDistributions) {
		const existing = result.find((r) => r.wins === winsDistribution.wins);
		if (existing) {
			existing.total += winsDistribution.total;
		} else {
			result.push(winsDistribution);
		}
	}
	return result;
};

const mergeMatchups = (matchups: readonly ArenaClassMatchup[]): ArenaClassMatchup[] => {
	const result: ArenaClassMatchup[] = [];
	for (const matchup of matchups) {
		const existing = result.find((r) => r.opponentClass === matchup.opponentClass);
		if (existing) {
			existing.totalGames += matchup.totalGames;
			existing.totalsWins += matchup.totalsWins;
		} else {
			result.push(matchup);
		}
	}
	return result;
};
