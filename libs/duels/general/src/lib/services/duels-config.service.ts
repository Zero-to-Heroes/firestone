import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { DuelsConfig } from '../models/duels-config';

const DUELS_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/duels-config.json';

@Injectable()
export class DuelsConfigService extends AbstractFacadeService<DuelsConfigService> {
	public duelsConfig$$: SubscriberAwareBehaviorSubject<DuelsConfig | null>;

	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'duelsConfig', () => !!this.duelsConfig$$);
	}

	protected override assignSubjects() {
		this.duelsConfig$$ = this.mainInstance.duelsConfig$$;
	}

	protected async init() {
		this.duelsConfig$$ = new SubscriberAwareBehaviorSubject<DuelsConfig | null>(null);
		this.api = AppInjector.get(ApiRunner);

		this.duelsConfig$$.onFirstSubscribe(async () => {
			const result: DuelsConfig | null = await this.api.callGetApi(DUELS_CONFIG_URL);
			console.log('[duels-config] loaded duels config');
			this.duelsConfig$$.next(result);
		});
	}
}
