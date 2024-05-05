/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { OfficialLeaderboardResult } from '@firestone-hs/official-leaderboards';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	WindowManagerService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { distinctUntilChanged, map } from 'rxjs';

const OFFICIAL_LEADERBOARD_URL = 'https://static.zerotoheroes.com/api/bgs/leaderboards/global.gz.json';
const OFFICIAL_LEADERBOARD_URL_DUOS = 'https://static.zerotoheroes.com/api/bgs/duo/leaderboards/global.gz.json';

@Injectable()
export class BattlegroundsOfficialLeaderboardService extends AbstractFacadeService<BattlegroundsOfficialLeaderboardService> {
	public leaderboards$$: SubscriberAwareBehaviorSubject<OfficialLeaderboardResult | null>;

	private prefs: PreferencesService;
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
		this.prefs = AppInjector.get(PreferencesService);

		await waitForReady(this.prefs);

		this.leaderboards$$.onFirstSubscribe(async () => {
			this.prefs.preferences$$
				.pipe(
					map((prefs) => prefs.bgsActiveGameMode),
					distinctUntilChanged(),
				)
				.subscribe(async (gameMode) => {
					const leaderboards = await this.loadLeaderboardsInternal(gameMode);
					this.leaderboards$$.next(leaderboards);
				});
		});
	}

	private async loadLeaderboards(
		gameMode: 'battlegrounds' | 'battlegrounds-duo',
	): Promise<OfficialLeaderboardResult | null> {
		return this.mainInstance.loadLeaderboardsInternal(gameMode);
	}

	private async loadLeaderboardsInternal(
		gameMode: 'battlegrounds' | 'battlegrounds-duo',
	): Promise<OfficialLeaderboardResult | null> {
		const url = gameMode === 'battlegrounds' ? OFFICIAL_LEADERBOARD_URL : OFFICIAL_LEADERBOARD_URL_DUOS;
		console.debug('[bgs-leaderboards] loading leaderboards', url);
		const leaderboards: OfficialLeaderboardResult | null = await this.api.callGetApi(url);
		console.debug('[bgs-leaderboards] loaded leaderboards', leaderboards);
		return leaderboards;
	}
}
