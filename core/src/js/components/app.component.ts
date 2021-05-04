import { ChangeDetectionStrategy, Component, Injector } from '@angular/core';
import { AppBootstrapService } from '../services/app-bootstrap.service';
import { SetsService } from '../services/collection/sets-service.service';
import { DebugService } from '../services/debug.service';
import { OverwolfService } from '../services/overwolf.service';
import { PreferencesService } from '../services/preferences.service';

@Component({
	selector: 'app-root',
	styleUrls: [`../../css/component/app.component.scss`],
	template: ` <div></div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
	constructor(
		private injector: Injector,
		private cards: SetsService,
		private debug: DebugService,
		private ow: OverwolfService,
		private prefs: PreferencesService,
	) {
		this.init();
	}

	private async init() {
		// First initialize the cards DB, as some of the dependencies injected in
		// app-bootstrap won't be able to start without the cards DB in place
		await this.cards.initializeCardsDb();
		const launchAppOnGameStart: boolean = (await this.prefs.getPreferences()).launchAppOnGameStart;
		console.log('should launch on game start?', launchAppOnGameStart);
		// See https://developers.overwolf.com/documentation/sdk/overwolf/extensions/#onapplaunchtriggered
		const appLaunchedByGameLaunch: boolean = this.isLaunchedByGameEvent();
		console.log('is app launched by a game event?', appLaunchedByGameLaunch);
		// If the app was launched and the game was not running, this means that
		// it was launched by a user action
		const shouldLaunchFullApp = launchAppOnGameStart || !appLaunchedByGameLaunch;
		console.log('should launch app?', shouldLaunchFullApp);
		if (shouldLaunchFullApp) {
			try {
				this.injector.get(AppBootstrapService).init();
			} catch (e) {
				console.error(e);
			}
		} else {
			console.log('not starting app, waiting for manual launch');
			this.ow.addAppLaunchTriggeredListener((result) => {
				console.log('starting app');
				this.injector.get(AppBootstrapService).init();
			});
		}
	}

	private isLaunchedByGameEvent(): boolean {
		console.log('window location', window.location.href);
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
