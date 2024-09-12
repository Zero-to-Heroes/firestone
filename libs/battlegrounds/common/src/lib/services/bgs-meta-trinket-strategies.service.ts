import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';

const META_TRINKET_STRATEGIES_URL =
	'https://static.zerotoheroes.com/hearthstone/data/battlegrounds-strategies/bgs-trinket-strategies.json';

@Injectable()
export class BgsMetaTrinketStrategiesService extends AbstractFacadeService<BgsMetaTrinketStrategiesService> {
	public strategies$$: SubscriberAwareBehaviorSubject<readonly BgsTrinketTip[] | null>;

	private localStorage: LocalStorageService;
	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsMetaTrinketStrategiesService', () => !!this.strategies$$);
	}

	protected override assignSubjects() {
		this.strategies$$ = this.mainInstance.strategies$$;
	}

	protected async init() {
		this.strategies$$ = new SubscriberAwareBehaviorSubject<readonly BgsTrinketTip[] | null>(null);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.api = AppInjector.get(ApiRunner);

		this.strategies$$.onFirstSubscribe(async () => {
			const localStats = this.localStorage.getItem<readonly BgsTrinketTip[]>(
				LocalStorageService.BGS_META_TRINKET_STRATEGIES,
			);
			this.strategies$$.next(localStats);

			const result = await this.api.callGetApi<readonly BgsTrinketTip[]>(META_TRINKET_STRATEGIES_URL);
			this.localStorage.setItem(LocalStorageService.BGS_META_TRINKET_STRATEGIES, result);
			this.strategies$$.next(result);
		});
	}
}

export interface BgsTrinketTip {
	readonly id: string;
	readonly tips: readonly BgsTrinketTipItem[];
}

export interface BgsTrinketTipItem {
	readonly summary: string;
	readonly author: string;
	readonly language: string;
	readonly patch: number;
	readonly date: Date;
}
