import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, AfterViewInit, EventEmitter } from '@angular/core';
import { PreferencesService } from '../../../services/preferences.service';
import { TwitchAuthService } from '../../../services/mainwindow/twitch-auth.service';

declare var overwolf;

@Component({
	selector: 'settings-broadcast',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/decktracker/settings-broadcast.component.scss`,
	],
	template: `
        <div class="decktracker-broadcast">
            <div class="twitch logged-out" *ngIf="!twitchedLoggedIn">
                <button (click)="connect()" class="text">Connect Firestone to your Twitch account</button>
            </div>
            <div class="twitch logged-in" *ngIf="twitchedLoggedIn">
                <button (click)="disconnect()" class="text">Disconnect your Twitch account</button>
            </div>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBroadcastComponent implements AfterViewInit {
    
    twitchedLoggedIn: boolean;
    twitchLoginUrl: string;

	constructor(
            private prefs: PreferencesService, 
            private cdr: ChangeDetectorRef, 
            private twitch: TwitchAuthService,
            private el: ElementRef) {
		this.loadDefaultValues();
    }

    ngAfterViewInit() {
        console.log('main window', overwolf.windows.getMainWindow());
        const preferencesEventBus: EventEmitter<any> = overwolf.windows.getMainWindow().preferencesEventBus;
        console.log('registered prefs event bus', preferencesEventBus);
		preferencesEventBus.subscribe(async (event) => {
			console.log('received pref event', event);
			if (event.name === PreferencesService.TWITCH_CONNECTION_STATUS) {
				await this.loadDefaultValues();
                console.log('broadcast prefs updated');
			}
        });
		this.cdr.detach();
    }

    connect() {
        overwolf.utils.openUrlInOverwolfBrowser(this.twitchLoginUrl);
    }

    disconnect() {
        console.log('disconnecting twitch');
        this.prefs.disconnectTwitch();
    }

	private async loadDefaultValues() {
        this.twitchLoginUrl = this.twitch.buildLoginUrl();
        this.twitchedLoggedIn = await this.twitch.isLoggedIn();
        this.cdr.detectChanges();
	}
}
