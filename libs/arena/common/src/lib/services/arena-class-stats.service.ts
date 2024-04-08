import { Injectable } from '@angular/core';
import { ArenaClassStats } from '@firestone-hs/arena-stats';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { distinctUntilChanged, map } from 'rxjs';
// import { PreferencesService } from '@firestone/shared/common/service';

const ARENA_CLASS_STATS_URL = `https://s3.us-west-2.amazonaws.com/static.zerotoheroes.com/api/arena/stats/classes/%timePeriod%/overview.gz.json`;

@Injectable()
export class ArenaClassStatsService extends AbstractFacadeService<ArenaClassStatsService> {
	public classStats$$: SubscriberAwareBehaviorSubject<ArenaClassStats | null | undefined>;

	private api: ApiRunner;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'arenaClassStats', () => !!this.classStats$$);
	}

	protected override assignSubjects() {
		this.classStats$$ = this.mainInstance.classStats$$;
	}

	protected async init() {
		this.classStats$$ = new SubscriberAwareBehaviorSubject<ArenaClassStats | null | undefined>(null);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);

		this.classStats$$.onFirstSubscribe(async () => {
			console.debug('[arena-class-stats] init');
			await this.prefs.isReady();

			this.prefs.preferences$$
				.pipe(
					map((prefs) => prefs.arenaActiveTimeFilter),
					distinctUntilChanged(),
				)
				.subscribe(async (timeFilter) => {
					const timePeriod =
						timeFilter === 'all-time'
							? 'past-20'
							: timeFilter === 'past-seven'
							? 'past-7'
							: timeFilter === 'past-three'
							? 'past-3'
							: timeFilter;
					const url = ARENA_CLASS_STATS_URL.replace('%timePeriod%', timePeriod);
					const result: ArenaClassStats | null = await this.api.callGetApi(url);
					console.log('[arena-class-stats] loaded duels config');
					this.classStats$$.next(result);
				});
		});
	}
}
