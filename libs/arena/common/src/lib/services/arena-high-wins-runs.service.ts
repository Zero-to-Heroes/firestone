/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { HighWinRunsInfo } from '@firestone-hs/arena-high-win-runs';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const RUNS_OVERVIEW_URL = `https://static.zerotoheroes.com/api/arena/stats/decks/%timePeriod%/overview.gz.json`;

@Injectable()
export class ArenaHighWinsRunsService extends AbstractFacadeService<ArenaHighWinsRunsService> {
	public runs$$: SubscriberAwareBehaviorSubject<HighWinRunsInfo | null | undefined>;

	private api: ApiRunner;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaHighWinsRunsService', () => !!this.runs$$);
	}

	protected override assignSubjects() {
		this.runs$$ = this.mainInstance.runs$$;
	}

	protected async init() {
		console.debug('[arena-high-wins-runs] global init');
		this.runs$$ = new SubscriberAwareBehaviorSubject<HighWinRunsInfo | null | undefined>(null);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);

		this.runs$$.onFirstSubscribe(async () => {
			console.debug('[arena-high-wins-runs] runs init');
			await this.prefs.isReady();

			const timePeriod = 'past-20';
			const runs = await this.api.callGetApi<HighWinRunsInfo>(
				RUNS_OVERVIEW_URL.replace('%timePeriod%', timePeriod),
			);
			if (runs == null) {
				console.error('[arena-high-wins-runs] could not load arena high-wins runs');
				return;
			}

			console.log('[arena-high-wins-runs] loaded arena stats');
			console.debug('[arena-high-wins-runs] loaded arena stats', runs);
			this.runs$$.next(runs);
		});
	}
}
