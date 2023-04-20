import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class AdService {
	public showAds$$ = new BehaviorSubject<boolean>(true);
	public isPremium$$ = new BehaviorSubject<boolean>(false);

	constructor(private ow: OverwolfService) {
		this.init();
	}

	private async init() {
		this.ow.onSubscriptionChanged(async (event) => {
			const showAds = await this.shouldDisplayAds();
			const isPremium = await this.enablePremiumFeatures();
			this.showAds$$.next(showAds);
			this.isPremium$$.next(isPremium);
		});
		const showAds = await this.shouldDisplayAds();
		const isPremium = await this.enablePremiumFeatures();
		this.showAds$$.next(showAds);
		this.isPremium$$.next(isPremium);
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
			return true;
		}
		const shouldDisplayAds = await this.shouldDisplayAds();
		return !shouldDisplayAds;
	}
}
