import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { DebugService } from '../../js/services/debug.service';
import { PreferencesService } from '../../js/services/preferences.service';
import { AppBootstrapService } from './app-bootstrap.service';

@Component({
	selector: 'app-root',
	styleUrls: [`../../css/component/app.component.scss`],
	template: ` <div></div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DaemonComponent {
	constructor(
		private readonly injector: Injector,
		private readonly debug: DebugService,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
	) {
		this.init();
	}

	// This is just like a sleeping daemon. It listens to pref changes or user action to really start the app,
	// otherwise it just stays there with very minimal process and data loaded
	private async init() {
		const launchAppOnGameStart: boolean = (await this.prefs.getPreferences()).launchAppOnGameStart;
		console.log('[daemon] should launch on game start?', launchAppOnGameStart);
		// See https://developers.overwolf.com/documentation/sdk/overwolf/extensions/#onapplaunchtriggered
		const appLaunchedByGameLaunch: boolean = this.isLaunchedByGameEvent();
		console.log('[daemon] is app launched by a game event?', appLaunchedByGameLaunch);
		// If the app was launched and the game was not running, this means that
		// it was launched by a user action
		const shouldLaunchFullApp = launchAppOnGameStart || !appLaunchedByGameLaunch;
		console.log('[daemon] should launch app?', shouldLaunchFullApp);
		if (shouldLaunchFullApp) {
			try {
				this.injector.get(AppBootstrapService).init();
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log('[daemon] not starting app, waiting for manual launch');
			this.ow.addAppLaunchTriggeredListener((result) => {
				console.log('[daemon] starting app');
				this.injector.get(AppBootstrapService).init();
			});
		}
	}

	private isLaunchedByGameEvent(): boolean {
		console.log('[daemon] window location', window.location.href);
		if (!window.location.href) {
			return false;
		}
		const splitParams = window.location.href.split('?');
		if (!splitParams || splitParams.length < 2) {
			return false;
		}
		const urlSearchParams = splitParams[1];
		if (!urlSearchParams) {
			return false;
		}
		const searchParams = urlSearchParams.split('&');
		if (!searchParams) {
			return false;
		}
		for (const param of searchParams) {
			const split = param.split('=');
			if (!split || split.length < 2) {
				return false;
			}
			const key = split[0];
			if (key === 'source') {
				return split[1] === 'gamelaunchevent';
			}
		}
		return false;
	}
}
