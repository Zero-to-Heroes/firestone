import { Injectable } from '@angular/core';
import { LocalStorageService } from '@firestone/shared/framework/core';
import { ApiRunner } from '../api-runner';
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
		const localStats = this.localStorage.getItem<BgsHeroStrategies>(LocalStorageService.BGS_META_HERO_STRATEGIES);
		console.debug('[bgs-meta-strat] localStats', localStats);
		if (!!localStats?.heroes?.length) {
			this.store.send(new BattlegroundsMetaHeroStrategiesLoadedEvent(localStats));
		}

		const result = await this.api.callGetApi<BgsHeroStrategies>(META_HERO_STRATEGIES_URL);
		console.debug('[bgs-meta-strat] result', result);
		this.localStorage.setItem(LocalStorageService.BGS_META_HERO_STRATEGIES, result);
		this.store.send(new BattlegroundsMetaHeroStrategiesLoadedEvent(result));
	}
}

export interface BgsHeroStrategies {
	readonly lastUpdateDate: Date;
	readonly heroes: readonly BgsHeroStratHero[];
	readonly curves: readonly BgsHeroCurve[];
	readonly authors: readonly BgsHeroStratAuthor[];
}

export interface BgsHeroStratHero {
	readonly id: string;
	readonly tips: readonly BgsHeroStratTip[];
}

export interface BgsHeroStratTip {
	readonly summary: string;
	readonly description: string;
	readonly curves: readonly BgsHeroCurveId[];
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

export interface BgsHeroCurve {
	readonly id: BgsHeroCurveId;
	readonly name: string;
	readonly notes: string;
	readonly steps: readonly BgsHeroCurveStep[];
}

export interface BgsHeroCurveStep {
	readonly turn: number;
	readonly actions: readonly (BgsHeroCurveAction | BgsHeroCurveActionExtended)[];
}

export interface BgsHeroCurveActionExtended {
	readonly type: BgsHeroCurveAction;
	readonly param: number;
}

export type BgsHeroCurveId = 'basic' | '3-on-3';
export type BgsHeroCurveAction = 'buy' | 'roll' | 'sell' | 'level';
