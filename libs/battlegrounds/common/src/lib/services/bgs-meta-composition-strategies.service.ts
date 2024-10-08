import { Injectable } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';

const META_COMPOSITION_STRATEGIES_URL =
	'https://static.zerotoheroes.com/hearthstone/data/battlegrounds-strategies/bgs-comps-strategies.gz.json';

@Injectable()
export class BgsMetaCompositionStrategiesService extends AbstractFacadeService<BgsMetaCompositionStrategiesService> {
	public strategies$$: SubscriberAwareBehaviorSubject<readonly BgsCompAdvice[] | null>;

	private localStorage: LocalStorageService;
	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsMetaCompositionStrategiesService', () => !!this.strategies$$);
	}

	protected override assignSubjects() {
		this.strategies$$ = this.mainInstance.strategies$$;
	}

	protected async init() {
		this.strategies$$ = new SubscriberAwareBehaviorSubject<readonly BgsCompAdvice[] | null>(null);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.api = AppInjector.get(ApiRunner);

		this.strategies$$.onFirstSubscribe(async () => {
			const localStats = this.localStorage.getItem<readonly BgsCompAdvice[]>(
				LocalStorageService.BGS_META_COMP_STRATEGIES,
			);
			this.strategies$$.next(localStats);

			const result = await this.api.callGetApi<readonly BgsCompAdvice[]>(META_COMPOSITION_STRATEGIES_URL);
			this.localStorage.setItem(LocalStorageService.BGS_META_COMP_STRATEGIES, result);
			this.strategies$$.next(result);
			console.debug('[bgs-meta-comp-strategies] loaded strategies', result);
		});
	}
}
