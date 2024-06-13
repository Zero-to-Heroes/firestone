/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { CommunityInfo } from '@firestone-hs/communities';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	UserService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { filter } from 'rxjs';
import { CommunityNavigationService } from './community-navigation.service';

const RETRIEVE_PERSONAL_COMMUNITY_URLS = 'https://3ftuxvbgkyrk2wvwl2l4j46ysq0kqdij.lambda-url.us-west-2.on.aws/';
const LOAD_COMMUNITY_URL = 'https://cgacfvcostpzszsmktrn3fw25y0ccxoa.lambda-url.us-west-2.on.aws/';

@Injectable()
export class PersonalCommunitiesService extends AbstractFacadeService<PersonalCommunitiesService> {
	public communities$$: SubscriberAwareBehaviorSubject<readonly CommunityInfo[] | null>;
	public selectedCommunity$$: SubscriberAwareBehaviorSubject<CommunityInfo | null>;

	private api: ApiRunner;
	private user: UserService;
	private nav: CommunityNavigationService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'PersonalCommunitiesService', () => !!this.communities$$);
	}

	protected override assignSubjects() {
		this.communities$$ = this.mainInstance.communities$$;
		this.selectedCommunity$$ = this.mainInstance.selectedCommunity$$;
	}

	protected async init() {
		this.communities$$ = new SubscriberAwareBehaviorSubject<readonly CommunityInfo[] | null>(null);
		this.selectedCommunity$$ = new SubscriberAwareBehaviorSubject<CommunityInfo | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.user = AppInjector.get(UserService);
		this.nav = AppInjector.get(CommunityNavigationService);

		this.communities$$.onFirstSubscribe(async () => {
			const joinedCommunities = await this.loadJoinedCommunities();
			this.communities$$.next(joinedCommunities);
		});

		this.selectedCommunity$$.onFirstSubscribe(() => {
			this.nav.selectedCommunity$$.pipe(filter((communityId) => !!communityId)).subscribe(async (communityId) => {
				const selectedCommunity = await this.loadCommunityDetails(communityId!);
				this.selectedCommunity$$.next(selectedCommunity);
			});
		});
	}

	public joinCommunity(newCommunity: CommunityInfo) {
		const current = this.communities$$.value;
		this.communities$$.next([...(current ?? []), newCommunity]);
	}

	private async loadCommunityDetails(communityId: string): Promise<CommunityInfo | null> {
		console.debug('[communities] retrieve community details', communityId);
		const user = await this.user.getCurrentUser();
		const result: CommunityInfo | null = await this.api.callPostApi<CommunityInfo>(LOAD_COMMUNITY_URL, {
			communityId: communityId,
			userName: user?.username,
		});
		console.debug('[communities] result', result);
		return result;
	}

	private async loadJoinedCommunities(): Promise<readonly CommunityInfo[] | null> {
		console.debug('[communities] retrieve user communities');
		const user = await this.user.getCurrentUser();
		const result: readonly CommunityInfo[] | null = await this.api.callPostApi<readonly CommunityInfo[]>(
			RETRIEVE_PERSONAL_COMMUNITY_URLS,
			{
				userName: user?.username,
			},
		);
		console.debug('[communities] result', result);
		return result;
	}
}
