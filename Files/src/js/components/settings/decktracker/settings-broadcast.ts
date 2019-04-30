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
                <a href="{{twitchLoginUrl}}" class="text">Connect Firestone to your Twitch account</a>                
            </div>
            <div class="twitch logged-in" *ngIf="twitchedLoggedIn">
                <!-- TODO: disconnect from Twitch -->
                Logged in Twitch              
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
		this.cdr.detach();
		this.loadDefaultValues();
    }

    ngAfterViewInit() {
		const preferencesEventBus: EventEmitter<any> = overwolf.windows.getMainWindow().preferencesEventBus;
		preferencesEventBus.subscribe((event) => {
			console.log('received pref event', event);
			if (event.name === PreferencesService.TWITCH_CONNECTION_STATUS) {
				this.loadDefaultValues();
			}
        });
    }

	private async loadDefaultValues() {
        this.twitchLoginUrl = this.twitch.buildLoginUrl();
        this.twitchedLoggedIn = await this.twitch.isLoggedIn();
        this.cdr.detectChanges();
	}
}
