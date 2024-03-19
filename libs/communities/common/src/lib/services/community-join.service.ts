import { Injectable } from '@angular/core';
import { AbstractFacadeService, ApiRunner, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';

const DUELS_CONFIG_URL = 'https://static.zerotoheroes.com/hearthstone/data/duels-config.json';

@Injectable()
export class CommunityJoinService extends AbstractFacadeService<CommunityJoinService> {
	// public duelsConfig$$: SubscriberAwareBehaviorSubject<DuelsConfig | null>;

	private api: ApiRunner;
	private user: UserService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CommunityJoinService', () => true /*!!this.duelsConfig$$*/);
	}

	protected override assignSubjects() {
		// this.duelsConfig$$ = this.mainInstance.duelsConfig$$;
	}

	protected async init() {
		// this.duelsConfig$$ = new SubscriberAwareBehaviorSubject<DuelsConfig | null>(null);
		this.api = AppInjector.get(ApiRunner);
	}

	public async joinCommunity(code: string) {
		return this.mainInstance.joinCommunityInternal(code);
	}

	private async joinCommunityInternal(code: string) {
		console.debug('joining community', code);
		const result = await this.api.callPostApi(JOIN_COMMUNITY_URL, { code: code });
		console.debug('result', result);
	}
}
