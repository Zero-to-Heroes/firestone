import { Injectable } from '@angular/core';
import { ApiRunner, EXTENSION_ID, OverwolfService } from '@firestone/shared/framework/core';

// const STORE_ID = 1564884;
const STORE_PUBLIC_TOKEN = 'xjh0-5ef1e6461f2aa381db4df635c3c0c5556aed5191';
const TEBEX_PACKAGES_URL = `https://subscriptions-api.overwolf.com/packages/${STORE_PUBLIC_TOKEN}?extensionId=${EXTENSION_ID}`;
const TEBEX_SUBSCRIPTIONS_URL = `https://subscriptions-api.overwolf.com/subscriptions/${STORE_PUBLIC_TOKEN}?extensionId=${EXTENSION_ID}`;

@Injectable({ providedIn: 'root' })
export class TebexService {
	constructor(private readonly ow: OverwolfService, private readonly api: ApiRunner) {}

	public async hasPremiumSubscription(): Promise<boolean> {
		return false;
		const sessionToken = await this.ow.generateSessionToken();
		if (!sessionToken?.length) {
			return false;
		}

		const subscriptionResult = await this.api.callGetApi(TEBEX_SUBSCRIPTIONS_URL, {
			bearerToken: sessionToken,
		});
		console.debug('[tebex] subscription result', subscriptionResult);
		return false;
	}
}
