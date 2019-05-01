import { Component, ChangeDetectionStrategy, Injector } from '@angular/core';

import { AppBootstrapService } from '../services/app-bootstrap.service';

const HEARTHSTONE_GAME_ID = 9898;

declare var overwolf: any;

@Component({
	selector: 'app-root',
	styleUrls: [`../../css/component/app.component.scss`],
	template: `
		<div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {

	constructor(private injector: Injector) {
        this.init();
    }

    private async init() {
        const launchAppOnGameStart: boolean = false;
        // See http://developers.overwolf.com/documentation/sdk/overwolf/extensions/#onapplaunchtriggered
        const appLaunchedByGameLaunch: boolean = this.isLaunchedByGameEvent();
        // If the app was launched and the game was not running, this means that 
        // it was launched by a user action
        const shouldLaunchFullApp = launchAppOnGameStart || !appLaunchedByGameLaunch;
        if (shouldLaunchFullApp) {
            this.injector.get(AppBootstrapService).init();
        } else {
            console.log('not starting app, waiting for manual launch');
            overwolf.extensions.onAppLaunchTriggered.addListener((result) => {
                console.log('starting app');
                this.injector.get(AppBootstrapService).init();
            });
        }
    }

    private isLaunchedByGameEvent(): boolean {
        console.log('window location', window.location.href);
        const urlSearchParams = window.location.href.split('?')[1];
        const searchParams = urlSearchParams.split('&');
        for (let param of searchParams) {
            const key = param.split('=')[0];
            if (key === 'source') {
                return param.split('=')[1] === 'gamelaunchevent';
            }
        }
        return false;
    }
    
    // private async isGameRunning(): Promise<boolean> {
    //     return new Promise<boolean>((resolve) => {
    //         overwolf.games.getRunningGameInfo((res: any) => {
    //             // console.log('running game info', res);
    //             if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
    //                 console.log('game running, not starting app');
    //                 resolve(true);
    //             }
    //             else {
    //                 console.log('game not running, app started manually');
    //                 resolve(false);
    //             }
    //         });
	// 	});
    // }
}
