import { Injectable } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const META_COMPOSITION_STRATEGIES_URL =
	'https://static.zerotoheroes.com/hearthstone/data/battlegrounds-strategies/bgs-comps-strategies.gz.json';
// const META_COMPOSITION_STRATEGIES_URL =
// 	'https://s3.us-west-2.amazonaws.com/static.zerotoheroes.com/hearthstone/data/battlegrounds-strategies/bgs-comps-strategies.gz.json';

@Injectable()
export class BgsMetaCompositionStrategiesService extends AbstractFacadeService<BgsMetaCompositionStrategiesService> {
	public strategies$$: SubscriberAwareBehaviorSubject<readonly BgsCompAdvice[] | null>;

	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BgsMetaCompositionStrategiesService', () => !!this.strategies$$);
	}

	protected override assignSubjects() {
		this.strategies$$ = this.mainInstance.strategies$$;
	}

	protected async init() {
		this.strategies$$ = new SubscriberAwareBehaviorSubject<readonly BgsCompAdvice[] | null>(null);
		this.api = AppInjector.get(ApiRunner);

		this.strategies$$.onFirstSubscribe(async () => {
			const result = await this.api.callGetApi<readonly BgsCompAdvice[]>(META_COMPOSITION_STRATEGIES_URL);
			this.strategies$$.next(result);
			console.debug('[bgs-meta-comp-strategies] loaded strategies', result);
		});
	}
}
