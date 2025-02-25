import { Injectable } from '@angular/core';
import { TebexService } from '@firestone/shared/common/service';
import {
	AbstractFacadeService,
	AppInjector,
	IAdsService,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, distinctUntilChanged } from 'rxjs';
import { AppUiStoreFacadeService } from './ui-store/app-ui-store-facade.service';

@Injectable()
export class AdService extends AbstractFacadeService<AdService> implements IAdsService {
	public hasPremiumSub$$: BehaviorSubject<boolean>;
	public enablePremiumFeatures$$: BehaviorSubject<boolean>;

	private ow: OverwolfService;
	private store: AppUiStoreFacadeService;
	private tebex: TebexService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'adsService', () => !!this.hasPremiumSub$$);
	}

	protected override assignSubjects() {
		this.enablePremiumFeatures$$ = this.mainInstance.enablePremiumFeatures$$;
		this.hasPremiumSub$$ = this.mainInstance.hasPremiumSub$$;
	}

	protected async init() {
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(false);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(false);
		this.ow = AppInjector.get(OverwolfService);
		this.store = AppInjector.get(AppUiStoreFacadeService);
		this.tebex = AppInjector.get(TebexService);
		this.addDevMode();

		this.ow.onSubscriptionChanged(async (event) => {
			console.log('[ads] subscription changed', event);
			const showAds = await this.shouldDisplayAds();
			this.hasPremiumSub$$.next(!showAds);
		});

		const showAds = await this.shouldDisplayAds();
		this.hasPremiumSub$$.next(!showAds);

		await this.store.initComplete();
		combineLatest([this.hasPremiumSub$$, this.store.shouldTrackLottery$()]).subscribe(
			([isPremium, shouldTrack]) => {
				console.debug('[ads] isPremium', isPremium, 'show ads?', shouldTrack);
				this.enablePremiumFeatures$$.next(isPremium || shouldTrack);
			},
		);
		this.hasPremiumSub$$.pipe(distinctUntilChanged()).subscribe((hasPremiumSub) => {
			console.debug('[ads] hasPremiumSub?', hasPremiumSub);
		});
	}

	public async shouldDisplayAds(): Promise<boolean> {
		return this.mainInstance.shouldDisplayAdsInternal();
	}

	public async shouldDisplayAdsInternal(): Promise<boolean> {
		const hasPremiumSub = await this.tebex.hasPremiumSubscription();
		if (hasPremiumSub) {
			console.log('[ads] user has a Tebex subscription');
			return false;
		}

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

	private addDevMode() {
		if (process.env.NODE_ENV === 'production') {
			return;
		}
		window['toggleAds'] = () => {
			this.enablePremiumFeatures$$.next(!this.enablePremiumFeatures$$.value);
			this.hasPremiumSub$$.next(!this.hasPremiumSub$$.value);
			console.debug('[ads] toggled ads', !this.hasPremiumSub$$.value);
		};
	}
}
