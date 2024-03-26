/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { OfficialLeaderboardResult } from '@firestone-hs/official-leaderboards';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const OFFICIAL_LEADERBOARD_URL = 'https://static.zerotoheroes.com/api/bgs/leaderboards/global.gz.json';

@Injectable()
export class BattlegroundsOfficialLeaderboardService extends AbstractFacadeService<BattlegroundsOfficialLeaderboardService> {
	public leaderboards$$: SubscriberAwareBehaviorSubject<OfficialLeaderboardResult | null>;

	// private prefs: PreferencesService;
	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BattlegroundsOfficialLeaderboardService', () => !!this.leaderboards$$);
	}

	protected override assignSubjects() {
		this.leaderboards$$ = this.mainInstance.leaderboards$$;
	}

	protected async init() {
		this.leaderboards$$ = new SubscriberAwareBehaviorSubject<OfficialLeaderboardResult | null>(null);
		this.api = AppInjector.get(ApiRunner);
		// this.prefs = AppInjector.get(PreferencesService);

		// await this.prefs.isReady();

		this.leaderboards$$.onFirstSubscribe(async () => {
			const leaderboards = await this.loadLeaderboardsInternal();
			this.leaderboards$$.next(leaderboards);
		});
	}

	public async loadLeaderboards(): Promise<OfficialLeaderboardResult | null> {
		return this.mainInstance.loadLeaderboardsInternal();
	}

	private async loadLeaderboardsInternal(): Promise<OfficialLeaderboardResult | null> {
		const url = OFFICIAL_LEADERBOARD_URL;
		console.debug('[bgs-leaderboards] loading leaderboards', url);
		const leaderboards: OfficialLeaderboardResult | null = await this.api.callGetApi(url);
		console.debug('[bgs-leaderboards] loaded leaderboards', leaderboards);
		return leaderboards;
	}
}
