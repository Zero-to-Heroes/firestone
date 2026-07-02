import { Injectable, InjectionToken } from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import Plausible from 'plausible-tracker';
import { AppInjector } from '../../..';
import { AbstractFacadeService } from '../abstract-facade-service';
import { isElectronContext, isMainProcess } from '../electron-utils';
import { WindowManagerService } from '../window-manager.service';

export const PLAUSIBLE_DOMAIN = new InjectionToken<string>('plausible.domain');

const PLAUSIBLE_API_HOST = 'https://apps.zerotoheroes.com';

@Injectable()
export class AnalyticsService extends AbstractFacadeService<AnalyticsService> {
	private plausible: ReturnType<typeof Plausible>;
	private domain: string;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'AnalyticsService', () => !!this.plausible);
	}

	protected override assignSubjects(): void {
		// Do nothing
	}

	protected override createElectronProxy(_ipcRenderer: unknown): void {
		// Analytics runs in the Electron main process; renderer instances only proxy via IPC.
		this.plausible = {} as ReturnType<typeof Plausible>;
	}

	protected override initElectronSubjects(): void {
		// Do nothing
	}

	protected override async init() {
		this.domain = AppInjector.get(PLAUSIBLE_DOMAIN);
		console.log('[analytics] domain', this.domain);

		if (isMainProcess()) {
			// plausible-tracker relies on browser globals (location, XMLHttpRequest) and cannot run in Node.
			this.plausible = {} as ReturnType<typeof Plausible>;
		} else {
			this.plausible = Plausible({
				domain: this.domain,
				trackLocalhost: true,
				apiHost: PLAUSIBLE_API_HOST,
			});
		}

		try {
			await this.trackEventInternal('app-started');
		} catch (e) {
			console.error('[analytics] error tracking event', e);
		}
		console.log('[analytics] initialized', this.domain);
	}

	protected override async initElectronMainProcess(): Promise<void> {
		this.registerMainProcessMethod('trackEventInternal', (eventName: string, options?: EventOptions) =>
			this.trackEventInternal(eventName, options),
		);
		this.registerMainProcessMethod('trackPageViewInternal', (page: string | null) =>
			this.trackPageViewInternal(page),
		);
	}

	public async trackEvent(eventName: string, options?: EventOptions) {
		if (!isElectronContext()) {
			return this.trackEventInternal(eventName, options);
		}
		return this.callOnMainProcess('trackEventInternal', eventName, options);
	}

	private async trackEventInternal(eventName: string, options?: EventOptions) {
		await this.ready();
		if (isMainProcess()) {
			await this.sendPlausibleEvent(eventName, options);
			return;
		}
		this.plausible.trackEvent(eventName, {
			props: options,
		});
	}

	public async trackPageView(page: string | null) {
		if (!isElectronContext()) {
			return this.trackPageViewInternal(page);
		}
		return this.callOnMainProcess('trackPageViewInternal', page);
	}

	private async trackPageViewInternal(page: string | null) {
		if (!page) {
			return;
		}
		await this.ready();
		if (isMainProcess()) {
			await this.sendPlausibleEvent('pageview', { page });
			return;
		}
		this.plausible.trackEvent('pageview', {
			props: {
				page: page,
			},
		});
	}

	private async sendPlausibleEvent(eventName: string, props?: EventOptions) {
		const payload = {
			n: eventName,
			u: `firestoneapp://standalone/${eventName}`,
			d: this.domain,
			r: null,
			w: 0,
			h: 0,
			p: props ? JSON.stringify(props) : undefined,
		};
		try {
			await fetch(`${PLAUSIBLE_API_HOST}/api/event`, {
				method: 'POST',
				headers: { 'Content-Type': 'text/plain' },
				body: JSON.stringify(payload),
			});
		} catch (e) {
			console.error('[analytics] error sending event', eventName, e);
		}
	}

	private async ready() {
		while (!this.plausible) {
			await sleep(500);
		}
	}
}

export type EventOptions = {
	readonly [propName: string]: string | number | boolean;
};
