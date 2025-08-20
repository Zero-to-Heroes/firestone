import { Inject, Injectable, InjectionToken, Optional } from '@angular/core';
import { sleep, uuid } from '@firestone/shared/framework/common';
import Plausible from 'plausible-tracker';
import { OverwolfService } from '../overwolf.service';

export const PLAUSIBLE_DOMAIN = new InjectionToken<string>('plausible.domain');
@Injectable()
export class AnalyticsService {
	private plausible: ReturnType<typeof Plausible>;

	constructor(
		@Optional() private readonly ow: OverwolfService,
		@Inject(PLAUSIBLE_DOMAIN) private readonly domain: string,
	) {
		this.init();
	}

	private async init() {
		const currentWindow = await this.ow?.getCurrentWindow();
		if (!currentWindow || currentWindow?.name === OverwolfService.MAIN_WINDOW) {
			this.plausible = Plausible({
				domain: this.domain,
				trackLocalhost: true,
				apiHost: 'https://apps.zerotoheroes.com',
			});
			window['plausibleInstance'] = this.plausible;
			this.plausible['debugId'] = uuid();
			this.plausible.trackEvent('app-started');
			console.log('[analytics] created new Plausible instance', currentWindow?.name);
		} else {
			this.plausible = this.ow.getMainWindow()['plausibleInstance'];
			console.log('[analytics] reusing Plausible instance');
		}
		console.debug('[analytics] initialized', this.plausible);
	}

	public async trackEvent(eventName: string, options?: EventOptions) {
		await this.ready();
		this.plausible.trackEvent(eventName, {
			props: options,
		});
	}

	public async trackPageView(page: string) {
		await this.ready();
		this.plausible.trackEvent('pageview', {
			props: {
				page: page,
			},
		});
	}

	private async ready() {
		// Wait until the plausible member variable is not null
		while (!this.plausible) {
			await sleep(500);
		}
	}
}

export type EventOptions = {
	readonly [propName: string]: string | number | boolean;
};
