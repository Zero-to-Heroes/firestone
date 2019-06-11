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
            <h2>Broadcast on Twitch</h2>
            <p class="text">
                Firestone twitch extension allows you to stream while showing 
                your deck tracker in Twitch player. To do so you will need to:
            </p>
            <ol class="todo"> 
                <li>1. Install Firestone Twitch extension: <a href="" target="_blank">here</a>
                <li>2. Connect your Twitch account to Firestone
            </ol>

            <div class="twitch logged-out" *ngIf="twitchLoginUrl && !twitchedLoggedIn">
                <button (mousedown)="connect()" class="text">
                    <i class="twitch-icon">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#twitch"/>
                        </svg>
                    </i>
                    <span>Login with Twitch</span>
                </button>
            </div>
            <div class="twitch logged-in" *ngIf="twitchLoginUrl && twitchedLoggedIn">
                <div class="user-name">
                    Logged in as: <a href="https://www.twitch.tv/{{twitchUserName}}" target="_blank">{{twitchUserName}}</a>
                </div>
                <button (mousedown)="disconnect()" class="text">
                    <i class="twitch-icon">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#twitch"/>
                        </svg>
                    </i>
                    <span>Disconnect</span>
                </button>
            </div>
        </div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBroadcastComponent implements AfterViewInit {
    
    twitchedLoggedIn: boolean;
    twitchLoginUrl: string;
    twitchUserName: string;

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
        this.twitchedLoggedIn = await this.twitch.isLoggedIn();
        this.twitchUserName = (await this.prefs.getPreferences()).twitchUserName;
        this.twitchLoginUrl = this.twitch.buildLoginUrl();
        this.cdr.detectChanges();
	}
}
