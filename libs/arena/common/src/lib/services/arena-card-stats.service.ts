import { Injectable } from '@angular/core';
import { ArenaCardStat, ArenaCardStats } from '@firestone-hs/arena-stats';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const ARENA_CARD_STATS_URL = `https://s3.us-west-2.amazonaws.com/static.zerotoheroes.com/api/arena/stats/cards/%timePeriod%/%context%.gz.json`;

@Injectable()
export class ArenaCardStatsService extends AbstractFacadeService<ArenaCardStatsService> {
	public cardStats$$: SubscriberAwareBehaviorSubject<readonly ArenaCardStat[] | null | undefined>;

	private api: ApiRunner;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'arenaCardStats', () => !!this.cardStats$$);
	}

	protected override assignSubjects() {
		this.cardStats$$ = this.mainInstance.cardStats$$;
	}

	protected async init() {
		this.cardStats$$ = new SubscriberAwareBehaviorSubject<readonly ArenaCardStat[] | null | undefined>(null);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);

		this.cardStats$$.onFirstSubscribe(async () => {
			console.debug('[arena-card-stats] init');
			await this.prefs.isReady();

			this.prefs
				.preferences$((prefs) => prefs.arenaActiveTimeFilter)
				.subscribe(async ([timeFilter]) => {
					const timePeriod =
						timeFilter === 'all-time'
							? 'past-20'
							: timeFilter === 'past-seven'
							? 'past-7'
							: timeFilter === 'past-three'
							? 'past-3'
							: timeFilter;
					const context = 'global';
					const url = ARENA_CARD_STATS_URL.replace('%timePeriod%', timePeriod).replace('%context%', context);
					const result: ArenaCardStats | null = await this.api.callGetApi(url);
					console.log('[arena-card-stats] loaded duels config');
					this.cardStats$$.next(result?.stats);
				});
		});
	}
}
