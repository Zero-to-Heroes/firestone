import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { GameStat } from '@firestone/stats/data-access';
import { combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { GameStatsLoaderService } from './game-stats-loader.service';

@Injectable()
export class GameStatsProviderService {
	public gameStats$ = new SubscriberAwareBehaviorSubject<readonly GameStat[]>(null);

	constructor(private readonly store: AppUiStoreFacadeService, private readonly gameStats: GameStatsLoaderService) {
		window['gameStatsProvider'] = this;
		this.init();
	}

	private async init() {
		await Promise.all([this.store.initComplete(), this.gameStats.isReady()]);
		this.gameStats$.onFirstSubscribe(() => {
			combineLatest([this.gameStats.gameStats$$, this.store.listenPrefs$((prefs) => prefs.regionFilter)])
				.pipe(
					map(([stats, [regionFilter]]) =>
						stats?.stats?.filter(
							(stat) => !regionFilter || regionFilter === 'all' || stat.region === regionFilter,
						),
					),
					startWith([]),
				)
				.subscribe(this.gameStats$);
		});
	}
}
