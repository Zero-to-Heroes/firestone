import { Injectable } from '@angular/core';
import Plausible from 'plausible-tracker';

@Injectable()
export class AnalyticsService {
	plausible = Plausible({
		domain: 'firestoneapp.gg-app',
		trackLocalhost: true,
		apiHost: 'https://apps.zerotoheroes.com',
	});

	public trackEvent(eventName: string, options?: EventOptions) {
		this.plausible.trackEvent(eventName, {
			props: options,
		});
	}
}

export type EventOptions = {
	readonly [propName: string]: string | number | boolean;
};
