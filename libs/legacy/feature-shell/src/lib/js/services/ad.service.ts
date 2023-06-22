import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from './ui-store/app-ui-store-facade.service';

declare let amplitude;

@Injectable()
export class AdService {
	public showAds$$ = new BehaviorSubject<boolean>(true);
	public enablePremiumFeatures$$ = new BehaviorSubject<boolean>(false);
	public hasPremiumSub$$ = new BehaviorSubject<boolean>(false);

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreFacadeService) {
		this.init();
	}

	private async init() {
		this.ow.onSubscriptionChanged(async (event) => {
			const showAds = await this.shouldDisplayAds();
			this.showAds$$.next(showAds);
		});
		this.ow.onSubscriptionChanged(async (event) => {
			const isPremium = await this.hasPremiumSub();
			this.hasPremiumSub$$.next(isPremium);
		});
		const showAds = await this.shouldDisplayAds();
		const isPremium = await this.hasPremiumSub();
		this.showAds$$.next(showAds);
		this.hasPremiumSub$$.next(isPremium);

		await this.store.initComplete();
		combineLatest([this.hasPremiumSub$$, this.store.listenPrefs$((prefs) => prefs.showLottery)]).subscribe(
			([isPremium, [showLottery]]) => {
				amplitude.getInstance().logEvent('overlay-ads', { enabled: showLottery });
				console.debug('show ads?', isPremium, showLottery);
				this.enablePremiumFeatures$$.next(isPremium || showLottery);
			},
		);
	}

	public async shouldDisplayAds(): Promise<boolean> {
		if (process.env.NODE_ENV !== 'production') {
			console.warn('not display in dev');
			return true;
		}
		return new Promise<boolean>(async (resolve) => {
			// Use OW's subscription mechanism
			const [showAds, user] = await Promise.all([this.ow.shouldShowAds(), this.ow.getCurrentUser()]);
			console.log('should show ads', showAds);
			if (!showAds) {
				console.log('User has a no-ad subscription, not showing ads', showAds);
				resolve(false);
				return;
			}
			if (!user || !user.username) {
				resolve(true);
				return;
			}
			const username = user.username;
			if (!username) {
				console.log('user not logged in', user);
				resolve(true);
				return;
			}
			resolve(true);
		});
	}

	public async hasPremiumSub(): Promise<boolean> {
		if (process.env.NODE_ENV !== 'production') {
			console.warn('not display in dev');
			return false;
		}
		const shouldDisplayAds = await this.shouldDisplayAds();
		return !shouldDisplayAds;
	}
}
