import { Injectable } from '@angular/core';
import { ArenaHeroStrategies } from '@firestone-hs/content-craetor-input';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const META_HERO_STRATEGIES_URL =
	'https://static.zerotoheroes.com/hearthstone/data/arena/strategies/hero-strategies.gz.json';

@Injectable({ providedIn: 'root' })
export class ArenaMetaHeroStrategiesService extends AbstractFacadeService<ArenaMetaHeroStrategiesService> {
	public strategies$$: SubscriberAwareBehaviorSubject<ArenaHeroStrategies | null>;

	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaMetaHeroStrategiesService', () => !!this.strategies$$);
	}

	protected override assignSubjects() {
		this.strategies$$ = this.mainInstance.strategies$$;
	}

	protected async init() {
		this.strategies$$ = new SubscriberAwareBehaviorSubject<ArenaHeroStrategies | null>(null);
		this.api = AppInjector.get(ApiRunner);

		this.strategies$$.onFirstSubscribe(async () => {
			const result = await this.api.callGetApi<ArenaHeroStrategies>(META_HERO_STRATEGIES_URL);
			console.debug('[arena-heroes-meta-strat] result', result);
			this.strategies$$.next(result);
		});
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.strategies$$, 'ArenaHeroStrategies-strategies');
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.strategies$$ = new SubscriberAwareBehaviorSubject<ArenaHeroStrategies | null>(null);
	}
}
