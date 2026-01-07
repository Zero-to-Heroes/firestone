import { Injectable } from '@angular/core';
import { DiskCacheService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject, uuid } from '@firestone/shared/framework/common';
import { combineLatest, debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { AbstractFacadeService, waitForReady } from './abstract-facade-service';
import { ADS_SERVICE_TOKEN, IAdsService } from './ads-service.interface';
import { ApiRunner } from './api-runner';
import { AppInjector } from './app-injector';
import { CurrentUser, IUserService } from './user.service.interface';
import { WindowManagerService } from './window-manager.service';

const USER_MAPPING_UPDATE_URL = 'https://gpiulkkg75uipxcgcbfr4ixkju0ntere.lambda-url.us-west-2.on.aws/';

const clientId = `c2w6jk8xh548uxeh6wqu3ivmxpgnh8qi`;
const scope = `openid+profile`;
const redirectUri = `https://www.firestoneapp.gg/owAuth`;
export const loginUrl = `https://accounts.overwolf.com/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

@Injectable()
export class StandaloneUserService extends AbstractFacadeService<StandaloneUserService> implements IUserService {
	public user$$: SubscriberAwareBehaviorSubject<CurrentUser | null>;

	private api: ApiRunner;
	private ads: IAdsService;
	private diskCache: DiskCacheService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'UserService', () => !!this.user$$);
	}

	protected override assignSubjects() {
		this.user$$ = this.mainInstance.user$$;
	}

	protected async init() {
		this.user$$ = new SubscriberAwareBehaviorSubject<CurrentUser | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.ads = AppInjector.get(ADS_SERVICE_TOKEN);
		this.diskCache = AppInjector.get(DiskCacheService);

		await waitForReady(this.ads);

		await this.ensureUserIdExists();

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

		// const user = await this.retrieveUserInfo();
		// this.user$$.next(user);

		// this.ow.addLoginStateChangedListener(async () => {
		// 	const user = await this.retrieveUserInfo();
		// 	this.user$$.next(user);
		// });
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.user$$ = new SubscriberAwareBehaviorSubject<CurrentUser | null>(null);
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.user$$, 'StandaloneUserService-user');
	}

	public async getCurrentUser(): Promise<CurrentUser | null> {
		return await this.user$$.getValueWithInit();
	}

	public async login() {
		console.log('[user-service] login', loginUrl);
		const { shell } = eval('require')('electron');
		await shell.openExternal(loginUrl);
	}

	public async logout() {
		console.log('[user-service] logout');
		const user = await this.getCurrentUser();
		const newUser: CurrentUser = {
			...user,
			username: undefined,
		};
		this.user$$.next(newUser);
	}

	// private async retrieveUserInfo() {
	// 	console.warn('[user-service] sending back fake user info');
	// 	const result: CurrentUser = {
	// 		userId: '123',
	// 		username: 'test',
	// 		avatar: 'https://example.com/avatar.png',
	// 		channel: 'test',
	// 		machineId: '123',
	// 		partnerId: 123,
	// 		parameters: {},
	// 		installParams: {},
	// 		installerExtension: {},
	// 	};
	// 	return result;
	// }

	private async sendCurrentUser(user: CurrentUser | null, isPremium: boolean) {
		return;
		// // Don't send anything in dev to allow for impersonation
		// if (process.env['NODE_ENV'] !== 'production') {
		// 	console.warn('[user-service] not sending user mapping in dev');
		// 	return;
		// }

		// // console.log('[user-service] sending current user', user, isPremium);
		// if (!!user?.username) {
		// 	await this.api.callPostApi(USER_MAPPING_UPDATE_URL, {
		// 		userId: user.userId,
		// 		userName: user.username,
		// 		isPremium: isPremium,
		// 	});
		// }
	}

	private async ensureUserIdExists() {
		const user = await this.diskCache.getItem<LocalUser>(DiskCacheService.DISK_CACHE_KEYS.LOCAL_USER);
		if (user) {
			this.user$$.next(user);
			return;
		}

		const userId = `fs-std-${uuid()}`;
		const localUser: LocalUser = {
			userId,
		};
		await this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.LOCAL_USER, localUser);
		this.user$$.next({
			userId,
		});
	}
}

interface LocalUser {
	userId: string;
}
