import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class PremiumDeeplinkService {
	constructor(private readonly ow: OverwolfService, private readonly subscriptions: SubscriptionService) {
		this.init();
	}

	private async init() {
		this.ow.addAppLaunchTriggeredListener(async (info) => {
			console.debug('[ads] [premium-deeplink] app launch triggered', info);
			if (info?.origin !== 'urlscheme') {
				return;
			}

			const param = decodeURIComponent(info.parameter);
			console.debug('decoded param', param);
			const scheme = 'firestoneapp:///?';
			if (!param.startsWith(scheme)) {
				return;
			}

			const value = param.substring(scheme.length);
			console.debug('[ads] [premium-deeplink] callback value', value);
			const fragments = value.split('&');
			const resultFragment = fragments.find((fragment) => fragment.startsWith('result='));
			if (!resultFragment) {
				console.error('[ads] [premium-deeplink] could not find result fragment', value);
				return;
			}

			const result = resultFragment.split('=')[1];
			console.debug('[ads] [premium-deeplink] result', result);
			if (result !== 'success') {
				console.log('[ads] [premium-deeplink] result is not success', result);
				return;
			}

			const tempSessionToken = fragments[0];
			await this.subscriptions.isReady();
			await this.subscriptions.fetchCurrentPlan();
		});
	}
}
