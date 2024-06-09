/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	UserService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { filter } from 'rxjs';
import { Community } from '../models/communities';
import { CommunityNavigationService } from './community-navigation.service';

const RETRIEVE_PERSONAL_COMMUNITY_URLS = 'https://3ftuxvbgkyrk2wvwl2l4j46ysq0kqdij.lambda-url.us-west-2.on.aws/';
const LOAD_COMMUNITY_URL = 'https://cgacfvcostpzszsmktrn3fw25y0ccxoa.lambda-url.us-west-2.on.aws/';

@Injectable()
export class PersonalCommunitiesService extends AbstractFacadeService<PersonalCommunitiesService> {
	public communities$$: SubscriberAwareBehaviorSubject<readonly Community[] | null>;
	public selectedCommunity$$: SubscriberAwareBehaviorSubject<Community | null>;

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
		this.communities$$ = new SubscriberAwareBehaviorSubject<readonly Community[] | null>(null);
		this.selectedCommunity$$ = new SubscriberAwareBehaviorSubject<Community | null>(null);
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

	public joinCommunity(newCommunity: Community) {
		const current = this.communities$$.value;
		this.communities$$.next([...(current ?? []), newCommunity]);
	}

	private async loadCommunityDetails(communityId: string): Promise<Community | null> {
		console.debug('[communities] retrieve community details', communityId);
		const user = await this.user.getCurrentUser();
		const result: Community | null = await this.api.callPostApi<Community>(LOAD_COMMUNITY_URL, {
			communityId: communityId,
			userId: user?.userId,
			userName: user?.username,
		});
		console.debug('[communities] result', result);
		return result;
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
