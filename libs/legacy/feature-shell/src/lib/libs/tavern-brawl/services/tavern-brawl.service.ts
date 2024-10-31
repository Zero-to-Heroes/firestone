/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { TavernBrawlStats } from '@firestone-hs/tavern-brawl-stats';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const TAVERN_BRAWL_URL = 'https://static.zerotoheroes.com/api/tavern-brawl/tavern-brawl-stats-2.gz.json';

@Injectable()
export class TavernBrawlService extends AbstractFacadeService<TavernBrawlService> {
	public tavernBrawl$$: SubscriberAwareBehaviorSubject<TavernBrawlStats | null>;

	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'TavernBrawlService', () => !!this.tavernBrawl$$);
	}

	protected override assignSubjects() {
		this.tavernBrawl$$ = this.mainInstance.tavernBrawl$$;
	}

	protected async init() {
		this.tavernBrawl$$ = new SubscriberAwareBehaviorSubject<TavernBrawlStats | null>(null);
		this.api = AppInjector.get(ApiRunner);

		this.tavernBrawl$$.onFirstSubscribe(async () => {
			const result = await this.api.callGetApi<TavernBrawlStats>(TAVERN_BRAWL_URL);
			this.tavernBrawl$$.next(result);
		});
	}
}
