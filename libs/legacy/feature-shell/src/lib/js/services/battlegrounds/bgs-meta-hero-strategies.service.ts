import { Injectable } from '@angular/core';
import { ApiRunner } from '../api-runner';
import { LocalStorageService } from '../local-storage';
import { BattlegroundsMetaHeroStrategiesLoadedEvent } from '../mainwindow/store/events/battlegrounds/bgs-meta-hero-strategies-loaded-event';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

const META_HERO_STRATEGIES_URL =
	'https://static.zerotoheroes.com/hearthstone/data/battlegrounds-strategies/battlegrounds-strategies.json';

@Injectable()
export class BgsMetaHeroStrategiesService {
	constructor(
		private readonly localStorage: LocalStorageService,
		private readonly store: AppUiStoreFacadeService,
		private readonly api: ApiRunner,
	) {}

	public async loadMetaHeroStrategies() {
		const localStats = this.localStorage.getItem<BgsHeroStrategies>('bgs-meta-hero-strategies');
		console.debug('[bgs-meta-strat] localStats', localStats);
		if (!!localStats?.heroes?.length) {
			this.store.send(new BattlegroundsMetaHeroStrategiesLoadedEvent(localStats));
		}

		const result = await this.api.callGetApi<BgsHeroStrategies>(META_HERO_STRATEGIES_URL);
		console.debug('[bgs-meta-strat] result', result);
		this.localStorage.setItem('bgs-meta-hero-strategies', result);
		this.store.send(new BattlegroundsMetaHeroStrategiesLoadedEvent(result));
	}
}

export interface BgsHeroStrategies {
	readonly lastUpdateDate: Date;
	readonly heroes: readonly BgsHeroStratHero[];
	readonly authors: readonly BgsHeroStratAuthor[];
}

export interface BgsHeroStratHero {
	readonly id: string;
	readonly tips: readonly BgsHeroStratTip[];
}

export interface BgsHeroStratTip {
	readonly summary: string;
	readonly description: string;
	readonly author: string;
	readonly language: string;
	readonly patch: number;
	readonly date: Date;
}

export interface BgsHeroStratAuthor {
	readonly id: string;
	readonly name: string;
	readonly link: string;
	readonly pictureUrl: string;
	readonly highlights: string;
}
