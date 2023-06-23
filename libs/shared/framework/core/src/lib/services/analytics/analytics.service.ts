import { Injectable } from '@angular/core';
import Plausible from 'plausible-tracker';

@Injectable()
export class AnalyticsService {
	// TODO: make that configurable
	plausible = Plausible({
		domain: 'firestoneapp.gg',
		trackLocalhost: true,
		apiHost: 'https://apps.zerotoheroes.com',
	});

	public trackEvent(eventName: string) {
		this.plausible.trackEvent(eventName);
	}
}
