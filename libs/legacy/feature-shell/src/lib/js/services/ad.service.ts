import { Injectable } from '@angular/core';
import {
	AbstractFacadeService,
	AppInjector,
	IAdsService,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from './ui-store/app-ui-store-facade.service';

const SHOW_ADS_IN_DEV = false;

@Injectable()
export class AdService extends AbstractFacadeService<AdService> implements IAdsService {
	public showAds$$: BehaviorSubject<boolean>;
	public enablePremiumFeatures$$: BehaviorSubject<boolean>;
	public hasPremiumSub$$: BehaviorSubject<boolean>;

	private ow: OverwolfService;
	private store: AppUiStoreFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'adsService', () => !!this.showAds$$);
	}

	protected override assignSubjects() {
		this.showAds$$ = this.mainInstance.showAds$$;
		this.enablePremiumFeatures$$ = this.mainInstance.enablePremiumFeatures$$;
		this.hasPremiumSub$$ = this.mainInstance.hasPremiumSub$$;
	}

	protected async init() {
		this.showAds$$ = new BehaviorSubject<boolean>(true);
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(false);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(false);
		this.ow = AppInjector.get(OverwolfService);
		this.store = AppInjector.get(AppUiStoreFacadeService);
		this.addDevMode();

		this.ow.onSubscriptionChanged(async (event) => {
			console.log('[ads] subscription changed', event);
			const showAds = await this.shouldDisplayAds();
			this.showAds$$.next(showAds);

			const isPremium = await this.hasPremiumSub();
			this.hasPremiumSub$$.next(isPremium);
		});
		const showAds = await this.shouldDisplayAds();
		const isPremium = await this.hasPremiumSub();
		this.showAds$$.next(showAds);
		this.hasPremiumSub$$.next(isPremium);

		await this.store.initComplete();
		combineLatest([this.hasPremiumSub$$, this.store.shouldTrackLottery$()]).subscribe(
			([isPremium, shouldTrack]) => {
				console.debug('[ads] isPremium', isPremium, 'show ads?', shouldTrack);
				this.enablePremiumFeatures$$.next(isPremium || shouldTrack);
			},
		);
	}

	public async shouldDisplayAds(): Promise<boolean> {
		return this.mainInstance.shouldDisplayAdsInternal();
	}

	public async shouldDisplayAdsInternal(): Promise<boolean> {
		// if (process.env.NODE_ENV !== 'production') {
		// 	console.warn('[ads] not display in dev');
		// 	return SHOW_ADS_IN_DEV;
		// }
		return new Promise<boolean>(async (resolve) => {
			// Use OW's subscription mechanism
			const [showAds, user] = await Promise.all([this.ow.shouldShowAds(), this.ow.getCurrentUser()]);
			console.log('[ads] should show ads', showAds);
			if (!showAds) {
				console.log('[ads] User has a no-ad subscription, not showing ads', showAds);
				resolve(false);
				return;
			}
			if (!user || !user.username) {
				resolve(true);
				return;
			}
			const username = user.username;
			if (!username) {
				console.log('[ads] user not logged in', user);
				resolve(true);
				return;
			}
			resolve(true);
		});
	}

	public async hasPremiumSub(): Promise<boolean> {
		return this.mainInstance.hasPremiumSubInternal();
	}

	private async hasPremiumSubInternal(): Promise<boolean> {
		// if (process.env.NODE_ENV !== 'production') {
		// 	console.warn('[ads] not display in dev');
		// 	return !SHOW_ADS_IN_DEV;
		// }
		const shouldDisplayAds = await this.shouldDisplayAds();
		return !shouldDisplayAds;
	}

	private addDevMode() {
		if (process.env.NODE_ENV === 'production') {
			return;
		}
		window['toggleAds'] = () => {
			this.showAds$$.next(!this.showAds$$.value);
			this.enablePremiumFeatures$$.next(!this.enablePremiumFeatures$$.value);
			this.hasPremiumSub$$.next(!this.hasPremiumSub$$.value);
			console.debug('[ads] toggled ads', this.showAds$$.value);
		};
	}
}
