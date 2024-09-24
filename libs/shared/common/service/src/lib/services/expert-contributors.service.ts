import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';

const EXPERT_CONTRIBUTORS_URL = 'https://static.zerotoheroes.com/hearthstone/data/expert-contributors.json';

@Injectable()
export class ExpertContributorsService extends AbstractFacadeService<ExpertContributorsService> {
	public contributors$$: SubscriberAwareBehaviorSubject<readonly ExpertContributor[] | null>;

	private localStorage: LocalStorageService;
	private api: ApiRunner;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ExpertContributorsService', () => !!this.contributors$$);
	}

	protected override assignSubjects() {
		this.contributors$$ = this.mainInstance.contributors$$;
	}

	protected async init() {
		this.contributors$$ = new SubscriberAwareBehaviorSubject<readonly ExpertContributor[] | null>(null);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.api = AppInjector.get(ApiRunner);

		this.contributors$$.onFirstSubscribe(async () => {
			const localStats = this.localStorage.getItem<readonly ExpertContributor[]>(
				LocalStorageService.EXPERT_CONTRIBUTORS,
			);
			console.debug('[expert-contributors] localStats', localStats);
			this.contributors$$.next(localStats);

			const result = await this.api.callGetApi<readonly ExpertContributor[]>(EXPERT_CONTRIBUTORS_URL);
			console.debug('[expert-contributors] result', result);
			this.localStorage.setItem(LocalStorageService.EXPERT_CONTRIBUTORS, result);
			this.contributors$$.next(result);
		});
	}
}

export interface ExpertContributor {
	readonly id: string;
	readonly name: string;
	readonly link: string;
	readonly pictureUrl: string;
	readonly highlights: string;
}
