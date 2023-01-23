import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';

@Injectable()
export class AdService {
	constructor(private http: HttpClient, private ow: OverwolfService) {}

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
}
