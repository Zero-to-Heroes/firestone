import { Injectable } from '@angular/core';
import Plausible from 'plausible-tracker';

@Injectable()
export class AnalyticsService {
	plausible = Plausible({
		domain: 'firestoneapp.gg-app',
		trackLocalhost: true,
		apiHost: 'https://apps.zerotoheroes.com',
	});

	public trackEvent(eventName: string) {
		this.plausible.trackEvent(eventName);
	}
}
