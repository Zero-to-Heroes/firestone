import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const META_TRINKET_STRATEGIES_URL =
	'https://static.zerotoheroes.com/hearthstone/data/battlegrounds-strategies/bgs-trinket-strategies.gz.json';

@Injectable()
export class BgsMetaTrinketStrategiesService extends AbstractFacadeService<BgsMetaTrinketStrategiesService> {
	public strategies$$: SubscriberAwareBehaviorSubject<readonly BgsTrinketTip[] | null>;

	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsMetaTrinketStrategiesService', () => !!this.strategies$$);
	}

	protected override assignSubjects() {
		this.strategies$$ = this.mainInstance.strategies$$;
	}

	protected async init() {
		this.strategies$$ = new SubscriberAwareBehaviorSubject<readonly BgsTrinketTip[] | null>(null);
		this.api = AppInjector.get(ApiRunner);

		this.strategies$$.onFirstSubscribe(async () => {
			const result = await this.api.callGetApi<readonly BgsTrinketTip[]>(META_TRINKET_STRATEGIES_URL);
			this.strategies$$.next(result);
			console.debug('[bgs-meta-trinket-strategies] loaded strategies', result);
		});
	}
}

export interface BgsTrinketTip {
	readonly cardId: string;
	readonly tips: readonly BgsTrinketTipItem[];
}

export interface BgsTrinketTipItem {
	readonly summary: string;
	readonly author: string;
	readonly language: string;
	readonly patch: number;
	readonly date: Date;
}
