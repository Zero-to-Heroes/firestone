import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { IGameStatsProviderService } from '@firestone/stats/common';
import { GameStat } from '@firestone/stats/data-access';
import { combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { GameStatsLoaderService } from './game-stats-loader.service';

@Injectable()
export class GameStatsProviderService
	extends AbstractFacadeService<GameStatsProviderService>
	implements IGameStatsProviderService
{
	public gameStats$$: SubscriberAwareBehaviorSubject<readonly GameStat[] | null>;

	private prefs: PreferencesService;
	private gameStats: GameStatsLoaderService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'GameStatsProviderService', () => !!this.gameStats$$);
	}

	protected override assignSubjects() {
		this.gameStats$$ = this.mainInstance.gameStats$$;
	}

	protected async init() {
		this.gameStats$$ = new SubscriberAwareBehaviorSubject<readonly GameStat[] | null>(null);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameStats = AppInjector.get(GameStatsLoaderService);

		await Promise.all([this.prefs.isReady(), this.gameStats.isReady()]);

		this.gameStats$$.onFirstSubscribe(() => {
			combineLatest([
				this.gameStats.gameStats$$,
				this.prefs.preferences$$.pipe(map((prefs) => prefs.regionFilter)),
			])
				.pipe(
					map(([stats, regionFilter]) =>
						stats?.stats?.filter(
							(stat) => !regionFilter || regionFilter === 'all' || stat.region === regionFilter,
						),
					),
					startWith([]),
				)
				.subscribe(this.gameStats$$);
		});
	}
}
