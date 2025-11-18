import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const META_HERO_STRATEGIES_URL =
	'https://static.zerotoheroes.com/hearthstone/data/battlegrounds-strategies/bgs-hero-strategies.gz.json';

@Injectable()
export class BgsMetaHeroStrategiesService extends AbstractFacadeService<BgsMetaHeroStrategiesService> {
	public strategies$$: SubscriberAwareBehaviorSubject<BgsHeroStrategies | null>;

	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsMetaHeroStrategiesService', () => !!this.strategies$$);
	}

	protected override assignSubjects() {
		this.strategies$$ = this.mainInstance.strategies$$;
	}

	protected async init() {
		this.strategies$$ = new SubscriberAwareBehaviorSubject<BgsHeroStrategies | null>(null);
		this.api = AppInjector.get(ApiRunner);

		this.strategies$$.onFirstSubscribe(async () => {
			const result = await this.api.callGetApi<BgsHeroStrategies>(META_HERO_STRATEGIES_URL);
			console.debug('[bgs-meta-strat] result', result);
			this.strategies$$.next(result);
		});
	}
}

export interface BgsHeroStrategies {
	readonly heroes: readonly BgsHeroStratHero[];
	readonly curves: readonly BgsHeroCurve[];
}

export interface BgsHeroStratHero {
	readonly cardId: string;
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
