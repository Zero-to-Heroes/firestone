import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const DISCOVERY_POOL_URL = 'https://static.zerotoheroes.com/api/arena/stats/discover/latest.gz.json';

@Injectable({ providedIn: 'root' })
export class ArenaRefService extends AbstractFacadeService<ArenaRefService> {
	public validDiscoveryPool$$: SubscriberAwareBehaviorSubject<readonly string[]>;

	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaRefService', () => !!this.validDiscoveryPool$$);
	}

	protected override assignSubjects() {
		this.validDiscoveryPool$$ = this.mainInstance.validDiscoveryPool$$;
	}

	protected async init() {
		this.validDiscoveryPool$$ = new SubscriberAwareBehaviorSubject<readonly string[]>([]);
		this.api = AppInjector.get(ApiRunner);

		this.validDiscoveryPool$$.onFirstSubscribe(async () => {
			const url = DISCOVERY_POOL_URL;
			const stats = await this.api.callGetApi<any>(url);
			const cardIds = stats?.cards
				// TODO: how to filter out the cards that are not discovrable?
				// .filter(s => s.stats.)
				.map((s) => s.cardId)
				// Unique
				.filter((cardId, index, self) => self.indexOf(cardId) === index);
			console.debug('[arena-ref] retrieved valid discovery pool', cardIds);
			this.validDiscoveryPool$$.next(cardIds ?? []);
		});
	}
}
