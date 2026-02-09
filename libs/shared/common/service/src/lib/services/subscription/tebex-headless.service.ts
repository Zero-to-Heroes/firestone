import { Injectable } from '@angular/core';
import { CurrentPlan } from './subscription.service';
import { TebexService, TebexSub } from './tebex.service';

const TEBEX_HEADLESS_SUBSCRIPTIONS_URL = 'https://mv7pyt4yrdeg2o26i6j5lljc2e0hnqti.lambda-url.us-west-2.on.aws/';

@Injectable({ providedIn: 'root' })
export class TebexHeadlessService extends TebexService {
	protected override async getSubscriptionStatusInternal(): Promise<CurrentPlan | null> {
		console.log('[ads] [tebex-headless] getting subscription status internal');
		const currentUser = await this.user.getCurrentUser();
		console.log('[ads] [tebex-headless] current user', currentUser);
		if (!currentUser?.username) {
			return null;
		}

		console.log('[ads] [tebex-headless] calling tebex headless subscriptions url');
		const tebexPlans = await this.api.callGetApi<readonly TebexSub[]>(TEBEX_HEADLESS_SUBSCRIPTIONS_URL, {
			bearerToken: currentUser.username,
		});
		console.log('[ads] [tebex-headless] tebexPlans', tebexPlans, currentUser.username);
		if (!tebexPlans?.length) {
			return null;
		}

		return null;
	}
}
