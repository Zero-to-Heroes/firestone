/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { TavernBrawlStats } from '@firestone-hs/tavern-brawl-stats';
import { ApiRunner } from '@services/api-runner';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalStorageService } from '../../../js/services/local-storage';
import { TavernBrawlState } from '../tavern-brawl-state';

const TAVERN_BRAWL_URL = 'https://static.zerotoheroes.com/api/tavern-brawl/tavern-brawl-stats.gz.json';

@Injectable()
export class TavernBrawlService {
	public tavernBrawl$ = new BehaviorSubject<TavernBrawlState>(TavernBrawlState.create({}));

	private requestedLoad = new BehaviorSubject<boolean>(null);

	constructor(
		private readonly store: AppUiStoreFacadeService,
		private readonly api: ApiRunner,
		private readonly localStorage: LocalStorageService,
	) {
		window['tavernBrawlProvider'] = this;
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		this.requestedLoad
			.asObservable()
			.pipe(filter((load) => load != null))
			.subscribe(() => this.loadStats());
	}

	public async loadStats() {
		const localInfo = this.localStorage.getItem<TavernBrawlStats>('tavern-brawl-stats');
		if (!!localInfo?.stats?.length) {
			console.log('loaded tavern brawl stats');
			this.updateStats(localInfo);
		}

		const result = await this.api.callGetApi<TavernBrawlStats>(TAVERN_BRAWL_URL);
		console.debug('[live-streams] loaded remote tavern-brawl stats', result);
		if (result == null) {
			return;
		}

		this.updateStats(result);
	}

	private updateStats(result: TavernBrawlStats) {
		const newState = this.tavernBrawl$.value.update({
			currentStats: result,
		});
		this.localStorage.setItem('tavern-brawl-stats', result);
		this.tavernBrawl$.next(newState);
	}
}
