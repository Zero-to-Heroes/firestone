import { Injectable } from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import { ApiRunner, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { AdService } from './ad.service';
import { CurrentUserEvent } from './mainwindow/store/events/current-user-event';
import { MainWindowStoreService } from './mainwindow/store/main-window-store.service';
import { deepEqual } from './utils';

const USER_MAPPING_UPDATE_URL = 'https://gpiulkkg75uipxcgcbfr4ixkju0ntere.lambda-url.us-west-2.on.aws/';

// TODO: use Hearthstone user id
@Injectable()
export class UserService {
	public user$$ = new BehaviorSubject<overwolf.profile.GetCurrentUserResult>(null);

	// private currentUser: overwolf.profile.GetCurrentUserResult;
	private store: MainWindowStoreService;

	constructor(
		private readonly ow: OverwolfService,
		private readonly api: ApiRunner,
		private readonly ads: AdService,
	) {}

	public async getCurrentUser(): Promise<overwolf.profile.GetCurrentUserResult> {
		await this.waitForInit();
		return this.user$$.value;
	}

	public async init(store: MainWindowStoreService) {
		combineLatest([this.ads.enablePremiumFeatures$$, this.user$$])
			.pipe(
				debounceTime(500),
				filter(([premium, user]) => !!user),
				distinctUntilChanged((a, b) => deepEqual(a, b)),
			)
			.subscribe(([premium, user]) => {
				console.log('[user-service] info', premium, user);
				this.sendCurrentUser(user, premium);
			});

		this.store = store;

		const user = await this.retrieveUserInfo();
		this.user$$.next(user);

		this.ow.addLoginStateChangedListener(async () => {
			const user = await this.retrieveUserInfo();
			this.user$$.next(user);
		});
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

	private async sendCurrentUser(user: overwolf.profile.GetCurrentUserResult, isPremium: boolean) {
		// Don't send anything in dev to allow for impersonation
		if (process.env.NODE_ENV !== 'production') {
			console.warn('[user-service] not sending user mapping in dev');
			return;
		}

		// console.log('[user-service] sending current user', user, isPremium);
		this.store.stateUpdater.next(new CurrentUserEvent(user));
		if (!!user.username) {
			await this.api.callPostApi(USER_MAPPING_UPDATE_URL, {
				userId: user.userId,
				userName: user.username,
				isPremium: isPremium,
			});
		}
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (!!this.user$$.value) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
