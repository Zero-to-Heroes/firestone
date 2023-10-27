import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { ConstructedConfig } from '../../models/decktracker/constructed-config';

const CONSTRUCTED_CONFIG_URL = 'https://static.firestoneapp.com/data/constructed-config.json';

@Injectable()
export class ConstructedConfigService extends AbstractFacadeService<ConstructedConfigService> {
	public config$$: SubscriberAwareBehaviorSubject<ConstructedConfig | null>;

	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'constructedConfig', () => !!this.config$$);
	}

	protected override assignSubjects() {
		this.config$$ = this.mainInstance.config$$;
	}

	protected async init() {
		this.config$$ = new SubscriberAwareBehaviorSubject<ConstructedConfig | null>(null);
		this.api = AppInjector.get(ApiRunner);

		this.config$$.onFirstSubscribe(async () => {
			const result: ConstructedConfig | null = await this.api.callGetApi(CONSTRUCTED_CONFIG_URL);
			console.log('[constructed-config] loaded config');
			this.config$$.next(result);
		});
	}
}
