import { Injectable } from '@angular/core';
import { buildOverwolfEndSessionUrl, DiskCacheService, SubscriptionService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject, uuid } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ADS_SERVICE_TOKEN,
	ApiRunner,
	AppInjector,
	CurrentUser,
	IAdsService,
	isMainProcess,
	IUserService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter } from 'rxjs';

const USER_MAPPING_UPDATE_URL = 'https://gpiulkkg75uipxcgcbfr4ixkju0ntere.lambda-url.us-west-2.on.aws/';
const LOGIN_URL = 'https://www.firestoneapp.com/login';
// const LOGIN_URL = 'http://localhost:4200/login';

// Auth callback data from deep link
export interface AuthCallbackData {
	token: string;
	userName: string;
	displayName: string;
	avatar: string;
	isPremium: boolean;
	provider: string;
	internalUserName: string;
}

// Stored auth data (persisted to disk)
interface StoredAuthData {
	userId: string; // Local device ID (fs-std-xxx)
	token?: string; // JWT token from auth
	userName?: string; // Authenticated username (e.g., Overwolf username)
	displayName?: string;
	avatar?: string;
	provider?: string;
	internalUserName?: string;
}

@Injectable()
export class StandaloneUserService extends AbstractFacadeService<StandaloneUserService> implements IUserService {
	public user$$: BehaviorSubject<CurrentUser | null>;

	private api: ApiRunner;
	private ads: IAdsService;
	private diskCache: DiskCacheService;
	/** True after loadStoredUserData (main) finishes; do not use as sole signal in renderer. */
	private storedUserDataLoaded = false;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'UserService', () => this.isUserServiceReady());
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

		// Load existing user data from disk
		await this.loadStoredUserData();

		// TODO: either here, or in the premium services?
		// Periodically check if the user is still premium (maybe once a day, and/or at app startup?)

		// Send user mapping updates when user or premium status changes
		combineLatest([this.ads.enablePremiumFeatures$$, this.user$$])
			.pipe(
				debounceTime(500),
				filter(([premium, user]) => !!user),
				distinctUntilChanged(
					(a, b) => a[0] === b[0] && a[1]?.userId === b[1]?.userId && a[1]?.username === b[1]?.username,
				),
			)
			.subscribe(([premium, user]) => {
				console.log('[user-service] user', user, 'isPremium', premium);
				this.sendCurrentUser(user, premium);
			});
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.user$$ = new SubscriberAwareBehaviorSubject<CurrentUser | null>(null);
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.user$$, 'StandaloneUserService-user');
	}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('logoutInternal', () => this.logoutInternal());
	}

	public async getCurrentUser(): Promise<CurrentUser | null> {
		return this.user$$.getValue();
	}

	/**
	 * Open the login page in the user's browser.
	 * After successful authentication, the auth-callback deep link will be triggered,
	 * and handleAuthCallback() should be called by the main process.
	 */
	public async login(): Promise<void> {
		console.log('[user-service] Opening login page:', LOGIN_URL);
		const { shell } = eval('require')('electron');
		await shell.openExternal(LOGIN_URL);
	}

	/**
	 * Log out the current user: clear local auth data, then open the Overwolf OIDC end-session URL
	 * so the browser IdP session is cleared (RP-initiated logout).
	 */
	public async logout(): Promise<void> {
		await this.callOnMainProcess('logoutInternal');
	}
	protected async logoutInternal(): Promise<void> {
		console.log('[user-service] Logging out...');

		const currentUser = await this.getCurrentUser();
		if (!currentUser) {
			return;
		}

		// Keep the local userId but clear auth-related fields
		const loggedOutUser: StoredAuthData = {
			userId: currentUser.userId!,
			token: undefined,
			userName: undefined,
			displayName: undefined,
			avatar: undefined,
			provider: undefined,
			internalUserName: undefined,
		};

		await this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.LOCAL_USER, loggedOutUser);

		this.user$$.next({
			userId: currentUser.userId,
			username: undefined,
			displayName: undefined,
			avatar: undefined,
		});

		console.log('[user-service] Logged out locally; opening OIDC end-session');

		const endSessionUrl = buildOverwolfEndSessionUrl();
		const { shell } = eval('require')('electron');
		await shell.openExternal(endSessionUrl);
	}

	/**
	 * Check if the user is currently authenticated (has a username from SSO)
	 */
	public isAuthenticated(): boolean {
		const user = this.user$$.getValue();
		return !!user?.username;
	}

	/**
	 * Handle successful authentication callback from deep link.
	 * This should be called by the main process when a firestoneapp://auth deep link is received.
	 */
	public async handleAuthCallback(authData: AuthCallbackData): Promise<void> {
		console.log('[user-service] Auth callback received for user:', authData);

		const currentUser = await this.getCurrentUser();

		// Create updated user data
		const updatedUser: StoredAuthData = {
			userId: authData.internalUserName || currentUser?.userId || `fs-std-${uuid()}`,
			token: authData.token,
			userName: authData.userName,
			displayName: authData.displayName,
			avatar: authData.avatar,
			provider: authData.provider,
			internalUserName: authData.internalUserName,
		};

		// Save to disk for persistence
		await this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.LOCAL_USER, updatedUser);

		// Update observable
		const user: CurrentUser = {
			userId: updatedUser.userId,
			username: updatedUser.userName,
			displayName: updatedUser.displayName,
			avatar: updatedUser.avatar,
		};
		this.user$$.next(user);

		// Deep link already tells us isPremium; apply before Tebex so tray / app access unlock right away.
		this.ads.applyAuthPremiumHint(authData.isPremium);

		console.log('[user-service] User authenticated successfully:', user.username);

		// Refresh Tebex in the background; currentPlan will correct any stale SSO hint.
		const subscription = AppInjector.get(SubscriptionService);
		void subscription.fetchCurrentPlan().catch((e) => {
			console.error('[user-service] fetchCurrentPlan after auth failed', e);
		});
	}

	public async interfaceLoginButton(): Promise<void> {
		// If user is logged in, logout
		const currentUser = await this.getCurrentUser();
		if (currentUser) {
			await this.logout();
		}
		// Otherwise, open the login page
		else {
			await this.login();
		}
	}

	/**
	 * Load stored user data from disk on startup
	 */
	private async loadStoredUserData(): Promise<void> {
		try {
			const storedData = await this.diskCache.getItem<StoredAuthData>(
				DiskCacheService.DISK_CACHE_KEYS.LOCAL_USER,
			);

			if (storedData?.userId) {
				const user: CurrentUser = {
					userId: storedData.userId,
					username: storedData.userName,
					displayName: storedData.displayName,
					avatar: storedData.avatar,
				};
				this.user$$.next(user);
				console.log('[user-service] Loaded stored user:', user.username || '(not authenticated)');
			} else {
				// Create new local user ID
				const userId = `fs-std-${uuid()}`;
				const newUser: StoredAuthData = { userId };
				await this.diskCache.storeItem(DiskCacheService.DISK_CACHE_KEYS.LOCAL_USER, newUser);
				this.user$$.next({ userId });
				console.log('[user-service] Created new local user:', userId);
			}
		} catch (e) {
			console.error('[user-service] loadStoredUserData failed', e);
		} finally {
			this.storedUserDataLoaded = true;
		}
	}

	private isUserServiceReady(): boolean {
		// Renderer proxy never runs loadStoredUserData; main must wait for disk.
		if (!isMainProcess()) {
			return !!this.user$$;
		}
		return this.storedUserDataLoaded;
	}

	/**
	 * Send current user mapping to backend
	 */
	private async sendCurrentUser(user: CurrentUser | null, isPremium: boolean): Promise<void> {
		// Don't send anything in dev to allow for impersonation
		if (process.env['NODE_ENV'] !== 'production') {
			console.debug('[user-service] Not sending user mapping in dev');
			return;
		}

		// Only send if user is authenticated (has username from SSO)
		if (!user?.username) {
			console.debug('[user-service] User not authenticated, skipping user mapping');
			return;
		}

		console.log('[user-service] Sending user mapping:', user.userId, user.username, isPremium);
		try {
			await this.api.callPostApi(USER_MAPPING_UPDATE_URL, {
				userId: user.userId,
				userName: user.username,
				isPremium: isPremium,
			});
		} catch (e) {
			console.error('[user-service] Failed to send user mapping:', e);
		}
	}
}
