/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { DraftCardCombinedStat, DraftStatsByContext } from '@firestone-hs/arena-draft-pick';
import { ArenaCardStat, ArenaCardStats, PlayerClass } from '@firestone-hs/arena-stats';
import { isDualClassArena } from '@firestone/game-state';
import { ArenaModeFilterType, PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { ArenaCombinedCardStat, ArenaCombinedCardStats, ArenaDraftCardStat } from '../models/arena-combined-card-stat';

const ARENA_CARD_DRAFT_STATS_URL = `https://static.zerotoheroes.com/api/arena/stats/draft/%modeFilter%/%timePeriod%/%context%.gz.json?v=6`;
const ARENA_CARD_MATCH_STATS_URL = `https://static.zerotoheroes.com/api/arena/stats/cards/%modeFilter%/%timePeriod%/%context%.gz.json?v=6`;

export const ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD = 6;
// For normal arena
export const ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD_FALLBACK = 3;

@Injectable()
export class ArenaCardStatsService extends AbstractFacadeService<ArenaCardStatsService> {
	public cardStats$$: SubscriberAwareBehaviorSubject<ArenaCombinedCardStats | null | undefined>;
	public searchString$$: BehaviorSubject<string | undefined>;

	private api: ApiRunner;
	private prefs: PreferencesService;
	private allCards: CardsFacadeService;

	private cachedStatsByContext: Record<string, ArenaCombinedCardStats | null> = {};

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaCardStatsService', () => !!this.cardStats$$);
	}

	protected override assignSubjects() {
		this.cardStats$$ = this.mainInstance.cardStats$$;
		this.searchString$$ = this.mainInstance.searchString$$;
	}

	protected async init() {
		this.cardStats$$ = new SubscriberAwareBehaviorSubject<ArenaCombinedCardStats | null | undefined>(null);
		this.searchString$$ = new BehaviorSubject<string | undefined>(undefined);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);
		this.allCards = AppInjector.get(CardsFacadeService);

		this.cardStats$$.onFirstSubscribe(async () => {
			await this.prefs.isReady();

			this.prefs.preferences$$
				.pipe(
					map((prefs) => ({
						timeFilter: prefs.arenaActiveTimeFilter,
						classFilter: prefs.arenaActiveClassFilter,
						heroPowerFilter: prefs.arenaActiveCardHeroPowerFilter,
						modeFilter: prefs.arenaActiveMode,
					})),
					distinctUntilChanged(
						(a, b) =>
							a?.timeFilter === b?.timeFilter &&
							a?.classFilter === b?.classFilter &&
							a?.heroPowerFilter === b?.heroPowerFilter &&
							a?.modeFilter === b?.modeFilter,
					),
				)
				.subscribe(async ({ timeFilter, classFilter, heroPowerFilter, modeFilter }) => {
					// console.debug('building arena card stats', new Error().stack);
					const heroPowerFilterContext =
						heroPowerFilter === 'all' || heroPowerFilter == null ? '' : `-${heroPowerFilter}`;
					const timePeriod =
						timeFilter === 'all-time'
							? 'past-20'
							: timeFilter === 'past-seven'
								? 'past-7'
								: timeFilter === 'past-three'
									? 'past-3'
									: timeFilter;
					const context = classFilter === 'all' || classFilter == null ? 'global' : classFilter;
					const result: ArenaCombinedCardStats | null = await this.buildCardStats(
						`${context}${heroPowerFilterContext}`,
						timePeriod,
						modeFilter,
					);
					this.cardStats$$.next(result);
				});
		});
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.cardStats$$ = new SubscriberAwareBehaviorSubject<ArenaCombinedCardStats | null | undefined>(null);
		this.searchString$$ = new BehaviorSubject<string | undefined>(undefined);
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.cardStats$$, 'ArenaCardStatsService-cardStats');
		this.setupElectronSubject(this.searchString$$, 'ArenaCardStatsService-searchString');
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod(
			'getStatsForInternal',
			(cardId: string, playerClass: PlayerClass, modeFilter: ArenaModeFilterType) =>
				this.getStatsForInternal(cardId, playerClass, modeFilter),
		);
		this.registerMainProcessMethod(
			'buildCardStatsInternal',
			(context: string, timePeriod: string, modeFilter: ArenaModeFilterType) =>
				this.buildCardStatsInternal(context, timePeriod, modeFilter),
		);
		this.registerMainProcessMethod('newSearchStringInternal', (newText: string | null | undefined) =>
			this.newSearchStringInternal(newText),
		);
	}

	public async getStatsFor(
		cardId: string,
		playerClass: PlayerClass,
		modeFilter: ArenaModeFilterType,
	): Promise<ArenaCombinedCardStat | null> {
		return this.callOnMainProcess<ArenaCombinedCardStat | null>(
			'getStatsForInternal',
			cardId,
			playerClass,
			modeFilter,
		);
	}

	private async getStatsForInternal(
		cardId: string,
		playerClass: PlayerClass,
		modeFilter: ArenaModeFilterType,
	): Promise<ArenaCombinedCardStat | null> {
		const key = `${playerClass}-${modeFilter}`;
		let cardStats = this.cachedStatsByContext[key];
		if (!cardStats) {
			cardStats = await this.buildCardStats(playerClass, 'last-patch', modeFilter);
			this.cachedStatsByContext[key] = cardStats;
		}
		const cardStat = cardStats?.stats?.find((s) => s.cardId === cardId) ?? null;
		if (
			playerClass !== 'global' &&
			(!cardStat?.matchStats?.stats?.drawn || cardStat.matchStats.stats.drawn < 200)
		) {
			return this.getStatsFor(cardId, 'global', modeFilter);
		}
		return cardStat;
	}

	public async buildCardStats(
		context: string,
		timePeriod: string,
		modeFilter: ArenaModeFilterType,
	): Promise<ArenaCombinedCardStats | null> {
		return this.callOnMainProcess<ArenaCombinedCardStats | null>(
			'buildCardStatsInternal',
			context?.toLowerCase(),
			timePeriod,
			modeFilter,
		);
	}
	private async buildCardStatsInternal(
		context: string,
		timePeriod: string,
		modeFilter: ArenaModeFilterType,
	): Promise<ArenaCombinedCardStats | null> {
		context = context?.toLowerCase?.() ?? 'global';
		if (!isDualClassArena && context.includes('-')) {
			context = context.split('-')[0];
		}
		const key = `${context}-${timePeriod}-${modeFilter}`;
		if (this.cachedStatsByContext[key]) {
			return this.cachedStatsByContext[key];
		}

		const modeFilterCorrected = modeFilter === 'arena-legacy' ? 'all' : modeFilter;
		const [cardPerformanceStats, cardDraftStats] = await Promise.all([
			this.api.callGetApi<ArenaCardStats>(
				ARENA_CARD_MATCH_STATS_URL.replace('%timePeriod%', timePeriod)
					.replace('%context%', context || 'global')
					.replace('%modeFilter%', modeFilterCorrected || 'arena-underground'),
			),
			this.api.callGetApi<DraftStatsByContext>(
				ARENA_CARD_DRAFT_STATS_URL.replace('%timePeriod%', timePeriod)
					.replace('%context%', context || 'global')
					.replace('%modeFilter%', modeFilterCorrected || 'arena-underground'),
			),
		]);
		if (cardPerformanceStats == null || cardDraftStats == null) {
			console.error(
				'[arena-card-stats] could not load arena stats',
				cardPerformanceStats == null,
				cardDraftStats == null,
			);
			return null;
		}

		console.debug('[arena-card-stats] loaded arena stats', cardPerformanceStats, cardDraftStats);

		const result: ArenaCombinedCardStats = {
			context: context,
			mode: modeFilter,
			timePeriod: timePeriod,
			lastUpdated: cardPerformanceStats.lastUpdated,
			stats: this.buildCombinedStats(cardPerformanceStats.stats, cardDraftStats.stats),
		};
		this.cachedStatsByContext[key] = result;
		return result;
	}

	public newSearchString(newText: string | null | undefined) {
		void this.callOnMainProcess('newSearchStringInternal', newText);
	}

	private async newSearchStringInternal(newText: string | null | undefined) {
		this.searchString$$.next(newText ?? undefined);
	}

	private buildCombinedStats(
		performanceStats: readonly ArenaCardStat[],
		draftStats: readonly DraftCardCombinedStat[],
	): ArenaCombinedCardStat[] {
		return performanceStats.map((stat: ArenaCardStat) => {
			const draftStat = draftStats.find(
				(draftStat) =>
					this.allCards.getRootCardId(draftStat.cardId) === this.allCards.getRootCardId(stat.cardId),
			);
			const result: ArenaCombinedCardStat = {
				cardId: stat.cardId,
				matchStats: stat,
				draftStats: this.buildDraftStats(draftStat),
			};
			return result;
		});
	}

	private buildDraftStats(stat: DraftCardCombinedStat | undefined): ArenaDraftCardStat | null {
		if (!stat?.statsByWins[0]?.offered) {
			return null;
		}

		const pickRate = stat.statsByWins[0].picked / stat.statsByWins[0].offered;
		let threshold = ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD;
		if (stat.statsByWins[ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD]?.offered == null) {
			threshold = ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD_FALLBACK;
		}
		const pickRateHighWins =
			stat.statsByWins[threshold]?.offered == null
				? null
				: stat.statsByWins[threshold]?.picked / stat.statsByWins[threshold]?.offered;
		const pickRateImpact = pickRateHighWins == null ? null : pickRateHighWins - pickRate;
		return {
			totalOffered: stat.statsByWins[0].offered,
			totalPicked: stat.statsByWins[0].picked,
			pickRate: pickRate,
			totalOfferedHighWins: stat.statsByWins[threshold]?.offered ?? 0,
			totalPickedHighWins: stat.statsByWins[threshold]?.picked ?? 0,
			pickRateHighWins: pickRateHighWins,
			pickRateImpact: pickRateImpact,
		};
	}
}
