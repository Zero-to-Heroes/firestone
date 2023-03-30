import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { WebsiteCoreState } from '../+state/website/core.models';
import { getPremium } from '../+state/website/core.selectors';
import { PremiumInfo } from '../preferences/website-preferences';

@Injectable()
export class AuthenticationService {
	private premium: boolean;

	constructor(private readonly store: Store<WebsiteCoreState>) {
		this.init();
	}

	private init() {
		this.store.select(getPremium).subscribe((premium) => {
			console.debug('updating premium', premium);
			this.premium = premium ?? false;
		});
	}

	public isPremium(): boolean {
		console.log('isPrmieum?');
		return this.premium;
	}

	public async checkPremium(userName: string): Promise<boolean> {
		return true;
	}
}

export const isValidPremium = (premium: PremiumInfo): boolean => {
	return premium?.isPremium && Date.now() - new Date(premium.lastUpdateDate).getTime() < 7 * 24 * 3600 * 1000;
};
