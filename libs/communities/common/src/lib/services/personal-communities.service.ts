import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	UserService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { Community } from '../models/communities';

const RETRIEVE_PERSONAL_COMMUNITY_URLS = 'https://3ftuxvbgkyrk2wvwl2l4j46ysq0kqdij.lambda-url.us-west-2.on.aws/';

@Injectable()
export class PersonalCommunitiesService extends AbstractFacadeService<PersonalCommunitiesService> {
	public communities$$: SubscriberAwareBehaviorSubject<readonly Community[] | null>;

	private api: ApiRunner;
	private user: UserService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'PersonalCommunitiesService', () => !!this.communities$$);
	}

	protected override assignSubjects() {
		this.communities$$ = this.mainInstance.communities$$;
	}

	protected async init() {
		this.communities$$ = new SubscriberAwareBehaviorSubject<readonly Community[] | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.user = AppInjector.get(UserService);

		this.communities$$.onFirstSubscribe(async () => {
			const joinedCommunities = await this.loadJoinedCommunities();
			this.communities$$.next(joinedCommunities);
		});
	}

	public joinCommunity(newCommunity: Community) {
		const current = this.communities$$.value;
		this.communities$$.next([...(current ?? []), newCommunity]);
	}

	private async loadJoinedCommunities(): Promise<readonly Community[] | null> {
		console.debug('[communities] retrieve user communities');
		const user = await this.user.getCurrentUser();
		const result: readonly Community[] | null = await this.api.callPostApi<readonly Community[]>(
			RETRIEVE_PERSONAL_COMMUNITY_URLS,
			{
				userId: user?.userId,
				userName: user?.username,
			},
		);
		console.debug('[communities] result', result);
		return result;
	}
}
