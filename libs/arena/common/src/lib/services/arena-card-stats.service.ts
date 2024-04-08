/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { DraftCardCombinedStat, DraftStatsByContext } from '@firestone-hs/arena-draft-pick';
import { ArenaCardStat, ArenaCardStats } from '@firestone-hs/arena-stats';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject, deepEqual } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject, distinctUntilChanged, map } from 'rxjs';
import { ArenaCombinedCardStat, ArenaCombinedCardStats, ArenaDraftCardStat } from '../models/arena-combined-card-stat';

const ARENA_CARD_MATCH_STATS_URL = `https://s3.us-west-2.amazonaws.com/static.zerotoheroes.com/api/arena/stats/cards/%timePeriod%/%context%.gz.json`;
const ARENA_CARD_DRAFT_STATS_URL = `https://s3.us-west-2.amazonaws.com/static.zerotoheroes.com/api/arena/stats/draft/%timePeriod%/%context%.gz.json`;

export const ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD = 6;

@Injectable()
export class ArenaCardStatsService extends AbstractFacadeService<ArenaCardStatsService> {
	public cardStats$$: SubscriberAwareBehaviorSubject<ArenaCombinedCardStats | null | undefined>;
	public searchString$$: BehaviorSubject<string | undefined>;

	private api: ApiRunner;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'arenaCardStats', () => !!this.cardStats$$);
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
			console.debug('[arena-card-stats] init');
			await this.prefs.isReady();

			this.prefs.preferences$$
				.pipe(
					map((prefs) => ({
						timeFilter: prefs.arenaActiveTimeFilter,
						classFilter: prefs.arenaActiveClassFilter,
					})),
					distinctUntilChanged((a, b) => deepEqual(a, b)),
				)
				.subscribe(async ({ timeFilter, classFilter }) => {
					const timePeriod =
						timeFilter === 'all-time'
							? 'past-20'
							: timeFilter === 'past-seven'
							? 'past-7'
							: timeFilter === 'past-three'
							? 'past-3'
							: timeFilter;
					const context = classFilter === 'all' || classFilter == null ? 'global' : classFilter;
					const [cardPerformanceStats, cardDraftStats] = await Promise.all([
						this.api.callGetApi<ArenaCardStats>(
							ARENA_CARD_MATCH_STATS_URL.replace('%timePeriod%', timePeriod).replace(
								'%context%',
								context,
							),
						),
						this.api.callGetApi<DraftStatsByContext>(
							ARENA_CARD_DRAFT_STATS_URL.replace('%timePeriod%', timePeriod).replace(
								'%context%',
								context,
							),
						),
					]);
					if (cardPerformanceStats == null || cardDraftStats == null) {
						console.error(
							'[arena-card-stats] could not load arena stats',
							cardPerformanceStats == null,
							cardDraftStats == null,
						);
						return;
					}

					console.log('[arena-card-stats] loaded arena stats');
					console.debug('[arena-card-stats] loaded arena stats', cardPerformanceStats, cardDraftStats);

					const result: ArenaCombinedCardStats = {
						context: context,
						lastUpdated: cardPerformanceStats.lastUpdated,
						stats: this.buildCombinedStats(cardPerformanceStats.stats, cardDraftStats.stats),
					};
					this.cardStats$$.next(result);
				});
		});
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
				matchStats: stat.stats,
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
		const pickRateHighWins =
			stat.statsByWins[ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD]?.offered == null
				? null
				: stat.statsByWins[ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD]?.picked /
				  stat.statsByWins[ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD]?.offered;
		const pickRateImpact = pickRateHighWins == null ? null : pickRateHighWins - pickRate;
		return {
			totalOffered: stat.statsByWins[0].offered,
			totalPicked: stat.statsByWins[0].picked,
			pickRate: pickRate,
			totalOfferedHighWins: stat.statsByWins[ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD]?.offered ?? 0,
			totalPickedHighWins: stat.statsByWins[ARENA_DRAFT_CARD_HIGH_WINS_THRESHOLD]?.picked ?? 0,
			pickRateHighWins: pickRateHighWins,
			pickRateImpact: pickRateImpact,
		};
	}
}
