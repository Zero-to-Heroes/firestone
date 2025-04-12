import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject, sleep } from '@firestone/shared/framework/common';
import { combineLatest, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { AbstractFacadeService, waitForReady } from './abstract-facade-service';
import { ADS_SERVICE_TOKEN, IAdsService } from './ads-service.interface';
import { ApiRunner } from './api-runner';
import { AppInjector } from './app-injector';
import { OverwolfService } from './overwolf.service';
import { WindowManagerService } from './window-manager.service';

const USER_MAPPING_UPDATE_URL = 'https://gpiulkkg75uipxcgcbfr4ixkju0ntere.lambda-url.us-west-2.on.aws/';

// TODO: use Hearthstone user id
@Injectable()
export class UserService extends AbstractFacadeService<UserService> {
	public user$$: SubscriberAwareBehaviorSubject<overwolf.profile.GetCurrentUserResult | null>;

	private ow: OverwolfService;
	private api: ApiRunner;
	private ads: IAdsService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'UserService', () => !!this.user$$);
	}

	protected override assignSubjects() {
		this.user$$ = this.mainInstance.user$$;
	}

	protected async init() {
		this.user$$ = new SubscriberAwareBehaviorSubject<overwolf.profile.GetCurrentUserResult | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.ow = AppInjector.get(OverwolfService);
		this.ads = AppInjector.get(ADS_SERVICE_TOKEN);

		await waitForReady(this.ads);

		combineLatest([this.ads.enablePremiumFeatures$$, this.user$$])
			.pipe(
				debounceTime(500),
				filter(([premium, user]) => !!user),
				distinctUntilChanged(
					(a, b) => a[0] === b[0] && a[1]?.userId === b[1]?.userId && a[1]?.username === b[1]?.username,
				),
			)
			.subscribe(([premium, user]) => {
				console.log('[user-service] info', premium, user);
				this.sendCurrentUser(user, premium);
			});

		const user = await this.retrieveUserInfo();
		this.user$$.next(user);

		this.ow.addLoginStateChangedListener(async () => {
			const user = await this.retrieveUserInfo();
			this.user$$.next(user);
		});
	}

	public async getCurrentUser(): Promise<overwolf.profile.GetCurrentUserResult | null> {
		return await this.user$$.getValueWithInit();
	}

	private async retrieveUserInfo() {
		let user = await this.ow.getCurrentUser();
		// console.log('[user-service] retrieved user info', user);
		while (user?.username && !user.avatar) {
			// console.log('[user-service] no avatar yet', user);
			user = await this.ow.getCurrentUser();
			await sleep(500);
		}
		return user;
	}

	private async sendCurrentUser(user: overwolf.profile.GetCurrentUserResult | null, isPremium: boolean) {
		// Don't send anything in dev to allow for impersonation
		if (process.env['NODE_ENV'] !== 'production') {
			console.warn('[user-service] not sending user mapping in dev');
			return;
		}

		// console.log('[user-service] sending current user', user, isPremium);
		if (!!user?.username) {
			await this.api.callPostApi(USER_MAPPING_UPDATE_URL, {
				userId: user.userId,
				userName: user.username,
				isPremium: isPremium,
			});
		}
	}
}
