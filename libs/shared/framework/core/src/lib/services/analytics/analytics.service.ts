import { Injectable, Optional } from '@angular/core';
import Plausible from 'plausible-tracker';
import { OverwolfService } from '../overwolf.service';

@Injectable()
export class AnalyticsService {
	private plausible: ReturnType<typeof Plausible>;

	constructor(@Optional() private readonly ow: OverwolfService) {
		this.init();
	}

	private async init() {
		const currentWindow = await this.ow?.getCurrentWindow();
		if (!currentWindow || currentWindow?.name === OverwolfService.MAIN_WINDOW) {
			this.plausible = Plausible({
				domain: 'firestoneapp.gg-app',
				trackLocalhost: true,
				apiHost: 'https://apps.zerotoheroes.com',
			});
			window['plausibleInstance'] = this.plausible;
		} else {
			this.plausible = window['plausibleInstance'];
		}
	}

	public trackEvent(eventName: string, options?: EventOptions) {
		this.plausible?.trackEvent(eventName, {
			props: options,
		});
	}

	public trackPageView(page: string) {
		this.plausible?.trackPageview({
			url: page,
		});
	}
}

export type EventOptions = {
	readonly [propName: string]: string | number | boolean;
};
