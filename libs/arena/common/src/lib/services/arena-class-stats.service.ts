import { Injectable } from '@angular/core';
import { ArenaClassStats } from '@firestone-hs/arena-stats';
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

const ARENA_CLASS_STATS_URL = `https://static.zerotoheroes.com/api/arena/stats/classes/%modeFilter%/%timePeriod%/overview.gz.json`;

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
				const result: ArenaClassStats | null = await this.buildClassStats(timePeriod, modeFilter);
				console.debug('[arena-class-stats] loaded class stats', result);
				this.classStats$$.next(result);
			});
		});
	}

	public async buildClassStats(timePeriod: string, modeFilter: ArenaModeFilterType): Promise<ArenaClassStats | null> {
		const modeFilterCorrected = modeFilter === 'arena-legacy' ? 'all' : modeFilter;
		const url = ARENA_CLASS_STATS_URL.replace('%timePeriod%', timePeriod).replace(
			'%modeFilter%',
			modeFilterCorrected,
		);
		const result: ArenaClassStats | null = await this.api.callGetApi(url);
		return result;
	}
}
