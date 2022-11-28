import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';

@Injectable()
export class GameStatsProviderService {
	public gameStats$ = new BehaviorSubject<readonly GameStat[]>(null);

	constructor(private readonly store: AppUiStoreFacadeService) {
		window['gameStatsProvider'] = this;
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		combineLatest(
			this.store.listen$(([main, nav]) => main.stats.gameStats?.stats),
			this.store.listenPrefs$((prefs) => prefs.regionFilter),
		)
			.pipe(
				map(([[stats], [regionFilter]]) =>
					stats.filter((stat) => !regionFilter || regionFilter === 'all' || stat.region === regionFilter),
				),
				startWith([]),
			)
			.subscribe(this.gameStats$);
	}
}
