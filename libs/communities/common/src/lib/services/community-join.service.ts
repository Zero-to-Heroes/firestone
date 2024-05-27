import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	UserService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { Community } from '../models/communities';
import { PersonalCommunitiesService } from './personal-communities.service';

const JOIN_COMMUNITY_URL = 'https://t2cgqsjooshgnnjqspi44vokqa0ywqmw.lambda-url.us-west-2.on.aws/';

@Injectable()
export class CommunityJoinService extends AbstractFacadeService<CommunityJoinService> {
	// public duelsConfig$$: SubscriberAwareBehaviorSubject<DuelsConfig | null>;

	private api: ApiRunner;
	private user: UserService;
	private personalCommunities: PersonalCommunitiesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CommunityJoinService', () => true /*!!this.duelsConfig$$*/);
	}

	protected override assignSubjects() {
		// this.duelsConfig$$ = this.mainInstance.duelsConfig$$;
	}

	protected async init() {
		// this.duelsConfig$$ = new SubscriberAwareBehaviorSubject<DuelsConfig | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.user = AppInjector.get(UserService);
		this.personalCommunities = AppInjector.get(PersonalCommunitiesService);
	}

	public async joinCommunity(code: string) {
		return this.mainInstance.joinCommunityInternal(code);
	}

	private async joinCommunityInternal(code: string): Promise<boolean> {
		console.debug('[communities] joining community', code);
		const user = await this.user.getCurrentUser();
		const result: Community | null = await this.api.callPostApi<Community>(JOIN_COMMUNITY_URL, {
			code: code,
			userId: user?.userId,
			userName: user?.username,
		});
		console.debug('[communities] result', result);
		if (result) {
			this.personalCommunities.joinCommunity(result);
		}

		return result != null;
	}
}
