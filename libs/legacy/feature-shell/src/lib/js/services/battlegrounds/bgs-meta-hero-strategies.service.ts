import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';

const META_HERO_STRATEGIES_URL =
	'https://static.zerotoheroes.com/hearthstone/data/battlegrounds-strategies/battlegrounds-strategies.json';

@Injectable()
export class BgsMetaHeroStrategiesService extends AbstractFacadeService<BgsMetaHeroStrategiesService> {
	public strategies$$: SubscriberAwareBehaviorSubject<BgsHeroStrategies | null>;

	private localStorage: LocalStorageService;
	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsMetaHeroStrategiesService', () => !!this.strategies$$);
	}

	protected override assignSubjects() {
		this.strategies$$ = this.mainInstance.strategies$$;
	}

	protected async init() {
		this.strategies$$ = new SubscriberAwareBehaviorSubject<BgsHeroStrategies | null>(null);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.api = AppInjector.get(ApiRunner);

		this.strategies$$.onFirstSubscribe(async () => {
			const localStats = this.localStorage.getItem<BgsHeroStrategies>(
				LocalStorageService.BGS_META_HERO_STRATEGIES,
			);
			console.debug('[bgs-meta-strat] localStats', localStats);
			this.strategies$$.next(localStats);

			const result = await this.api.callGetApi<BgsHeroStrategies>(META_HERO_STRATEGIES_URL);
			console.debug('[bgs-meta-strat] result', result);
			this.localStorage.setItem(LocalStorageService.BGS_META_HERO_STRATEGIES, result);
			this.strategies$$.next(result);
		});
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
