/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { DraftCardCombinedStat, DraftStatsByContext } from '@firestone-hs/arena-draft-pick';
import { ArenaCardStat, ArenaCardStats, PlayerClass } from '@firestone-hs/arena-stats';
import { ArenaModeFilterType, PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { ArenaCombinedCardStat, ArenaCombinedCardStats, ArenaDraftCardStat } from '../models/arena-combined-card-stat';

export const ARENA_CARD_DRAFT_STATS_URL = `https://static.zerotoheroes.com/api/arena/stats/draft/%modeFilter%/%timePeriod%/%context%.gz.json`;
export const ARENA_CARD_MATCH_STATS_URL = `https://static.zerotoheroes.com/api/arena/stats/cards/%modeFilter%/%timePeriod%/%context%.gz.json`;

export const ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD = 6;
// For normal arena
export const ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD_FALLBACK = 3;

@Injectable()
export class ArenaCardStatsService extends AbstractFacadeService<ArenaCardStatsService> {
	public cardStats$$: SubscriberAwareBehaviorSubject<ArenaCombinedCardStats | null | undefined>;
	public searchString$$: BehaviorSubject<string | undefined>;

	private api: ApiRunner;
	private prefs: PreferencesService;

	private cachedStats: ArenaCombinedCardStats | null;
	private cachedGlobalStats: ArenaCombinedCardStats | null;

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

		this.cardStats$$.onFirstSubscribe(async () => {
			await this.prefs.isReady();

			this.prefs.preferences$$
				.pipe(
					map((prefs) => ({
						timeFilter: prefs.arenaActiveTimeFilter,
						classFilter: prefs.arenaActiveClassFilter,
						modeFilter: prefs.arenaActiveMode,
					})),
					distinctUntilChanged(
						(a, b) =>
							a?.timeFilter === b?.timeFilter &&
							a?.classFilter === b?.classFilter &&
							a?.modeFilter === b?.modeFilter,
					),
				)
				.subscribe(async ({ timeFilter, classFilter, modeFilter }) => {
					// console.debug('building arena card stats', new Error().stack);
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
						context,
						timePeriod,
						modeFilter,
					);
					this.cardStats$$.next(result);
				});
		});
	}

	// public async getCardStats(timeFilter: ArenaTimeFilterType, classFilter: ArenaClassFilterType, modeFilter: ArenaModeFilterType): Promise<ArenaCombinedCardStats | null> {

	public async getStatsFor(
		cardId: string,
		playerClass: PlayerClass,
		modeFilter: ArenaModeFilterType,
	): Promise<ArenaCombinedCardStat | null> {
		return this.mainInstance.getStatsForInternal(cardId, playerClass, modeFilter);
	}

	private async getStatsForInternal(
		cardId: string,
		playerClass: PlayerClass,
		modeFilter: ArenaModeFilterType,
	): Promise<ArenaCombinedCardStat | null> {
		let cardStats = playerClass === 'global' ? this.cachedGlobalStats : this.cachedStats;
		if (playerClass === 'global') {
			if (
				!this.cachedGlobalStats?.stats?.length ||
				this.cachedGlobalStats?.timePeriod !== 'last-patch' ||
				this.cachedGlobalStats?.mode !== modeFilter
			) {
				cardStats = await this.buildCardStats('global', 'last-patch', modeFilter);
				this.cachedGlobalStats = cardStats;
			}
		} else if (
			this.cachedStats?.context !== playerClass ||
			this.cachedStats?.timePeriod !== 'last-patch' ||
			this.cachedStats?.mode !== modeFilter
		) {
			cardStats = await this.buildCardStats(playerClass, 'last-patch', modeFilter);
			this.cachedStats = cardStats;
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
		return this.mainInstance.buildCardStatsInternal(context?.toLowerCase(), timePeriod, modeFilter);
	}

	private async buildCardStatsInternal(
		context: string,
		timePeriod: string,
		modeFilter: ArenaModeFilterType,
	): Promise<ArenaCombinedCardStats | null> {
		if (
			context === 'global' &&
			this.cachedGlobalStats?.timePeriod === timePeriod &&
			this.cachedGlobalStats?.mode === modeFilter
		) {
			return this.cachedGlobalStats;
		} else if (
			this.cachedStats?.context === context &&
			this.cachedStats?.timePeriod === timePeriod &&
			this.cachedStats?.mode === modeFilter
		) {
			return this.cachedStats;
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

		console.log('[arena-card-stats] loaded arena stats', context, timePeriod);
		console.debug('[arena-card-stats] loaded arena stats', cardPerformanceStats, cardDraftStats);

		const result: ArenaCombinedCardStats = {
			context: context,
			mode: modeFilter,
			timePeriod: timePeriod,
			lastUpdated: cardPerformanceStats.lastUpdated,
			stats: this.buildCombinedStats(cardPerformanceStats.stats, cardDraftStats.stats),
		};
		if (context === 'global') {
			this.cachedGlobalStats = result;
		} else {
			this.cachedStats = result;
		}
		return result;
	}

	public newSearchString(newText: string) {
		this.mainInstance.newSearchStringInternal(newText);
	}

	private async newSearchStringInternal(newText: string) {
		this.searchString$$.next(newText);
	}

	private buildCombinedStats(
		performanceStats: readonly ArenaCardStat[],
		draftStats: readonly DraftCardCombinedStat[],
	): ArenaCombinedCardStat[] {
		return performanceStats.map((stat: ArenaCardStat) => {
			const draftStat = draftStats.find((draftStat) => draftStat.cardId === stat.cardId);
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
