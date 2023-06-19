import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from './ui-store/app-ui-store-facade.service';

declare let amplitude;

@Injectable()
export class AdService {
	public showAds$$ = new BehaviorSubject<boolean>(true);
	public isPremium$$ = new BehaviorSubject<boolean>(false);

	private premiumFeatures$$ = new BehaviorSubject<boolean>(false);

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreFacadeService) {
		this.init();
	}

	private async init() {
		this.ow.onSubscriptionChanged(async (event) => {
			const showAds = await this.shouldDisplayAds();
			this.showAds$$.next(showAds);
		});
		this.ow.onSubscriptionChanged(async (event) => {
			const isPremium = await this.enablePremiumFeatures();
			this.premiumFeatures$$.next(isPremium);
		});
		const betaChannel$$ = new BehaviorSubject<boolean>(false);
		overwolf.settings.getExtensionSettings((settingsResult) => {
			betaChannel$$.next(
				settingsResult?.settings?.channel === 'beta' || process.env['NODE_ENV'] !== 'production',
			);
			console.debug('beta channel?', betaChannel$$.value, settingsResult);
		});
		const showAds = await this.shouldDisplayAds();
		const isPremium = await this.enablePremiumFeatures();
		this.showAds$$.next(showAds);
		this.premiumFeatures$$.next(isPremium);

		await this.store.initComplete();
		combineLatest([
			this.premiumFeatures$$,
			this.store.listenPrefs$((prefs) => prefs.showOverlayAd),
			// betaChannel$$,
		]).subscribe(([isPremium, [showOverlayAd]]) => {
			amplitude.getInstance().logEvent('overlay-ads', { enabled: showOverlayAd });
			console.debug('show ads?', isPremium, showOverlayAd);
			this.isPremium$$.next(isPremium || showOverlayAd);
		});
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

	public async enablePremiumFeatures(): Promise<boolean> {
		if (process.env.NODE_ENV !== 'production') {
			console.warn('not display in dev');
			return false;
		}
		const shouldDisplayAds = await this.shouldDisplayAds();
		return !shouldDisplayAds;
	}
}
