import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';

const RETRIEVE_PERFECT_GAMES_ENDPOINT = 'https://static.zerotoheroes.com/api/bgs/bgs-perfect-games.json';

@Injectable()
export class BgsPerfectGamesService extends AbstractFacadeService<BgsPerfectGamesService> {
	public perfectGames$$: SubscriberAwareBehaviorSubject<readonly GameStat[]>;

	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'bgsPerfectGames', () => !!this.perfectGames$$);
	}

	protected override assignSubjects() {
		this.perfectGames$$ = this.mainInstance.perfectGames$$;
	}

	protected async init() {
		this.perfectGames$$ = new SubscriberAwareBehaviorSubject<readonly GameStat[]>(null);
		this.api = AppInjector.get(ApiRunner);

		this.perfectGames$$.onFirstSubscribe(async () => {
			console.log('[bgs-perfect-games] loading perfect games');
			const result = await this.api.callGetApi<readonly GameStat[]>(RETRIEVE_PERFECT_GAMES_ENDPOINT);
			const remotePerfectGames: readonly GameStat[] = (result ?? [])
				.map((res) =>
					GameStat.create({
						...res,
						gameFormat: 'wild',
						gameMode: 'battlegrounds',
						additionalResult: '1',
						bgsPerfectGame: true,
						// So that it's displayed in the UI
						bgsCompArchetype: res.bgsCompArchetype || '',
					}),
				)
				.filter((stat) => stat.playerRank);
			this.perfectGames$$.next(remotePerfectGames);
			console.debug('[bgs-perfect-games] loaded perfect games', remotePerfectGames);
		});
	}
}
