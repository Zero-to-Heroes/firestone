import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { TwitchAuthService } from '../../../services/mainwindow/twitch-auth.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

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
		<div class="decktracker-broadcast" scrollable>
			<h2>Broadcast on Twitch</h2>
			<p class="text">
				Firestone twitch extension allows you to stream while showing your deck tracker in the Twitch player, as
				well as letting them mouse over all the players in the leaderboard in Battlegrounds. To activate it, you
				will need to:
			</p>
			<ol class="todo">
				<li>
					1. Install the Firestone Twitch extension on your channel:
					<a
						href="https://www.twitch.tv/ext/jbmhw349lqbus9j8tx4wac18nsja9u"
						target="_blank"
						(mousedown)="preventMiddleClick($event)"
						(click)="preventMiddleClick($event)"
						(auxclick)="preventMiddleClick($event)"
						>here</a
					>
				</li>
				<li>2. Connect your Twitch account to Firestone by clicking the button below</li>
				<li>
					3. Tweak your options (see
					<a
						href="https://github.com/Zero-to-Heroes/firestone/wiki/Setting-up-the-Twitch-extension"
						target="_blank"
						(mousedown)="preventMiddleClick($event)"
						(click)="preventMiddleClick($event)"
						(auxclick)="preventMiddleClick($event)"
						>here</a
					>)
				</li>
			</ol>

			<div class="twitch logged-out" *ngIf="twitchLoginUrl && !twitchedLoggedIn">
				<button (mousedown)="connect()" class="text">
					<i class="twitch-icon">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#twitch" />
						</svg>
					</i>
					<span>Login with Twitch</span>
				</button>
			</div>
			<div class="twitch logged-in" *ngIf="twitchLoginUrl && twitchedLoggedIn">
				<div class="user-name">
					Logged in as:
					<a
						href="https://www.twitch.tv/{{ twitchUserName }}"
						target="_blank"
						(mousedown)="preventMiddleClick($event)"
						(click)="preventMiddleClick($event)"
						(auxclick)="preventMiddleClick($event)"
						>{{ twitchUserName }}</a
					>
				</div>
				<button (mousedown)="disconnect()" class="text">
					<i class="twitch-icon">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#twitch" />
						</svg>
					</i>
					<span>Disconnect</span>
				</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBroadcastComponent implements AfterViewInit, OnDestroy {
	twitchedLoggedIn: boolean;
	twitchLoginUrl: string;
	twitchUserName: string;

	private preferencesSubscription: Subscription;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private twitch: TwitchAuthService,
		private ow: OverwolfService,
		private el: ElementRef,
	) {
		this.loadDefaultValues();
	}

	ngAfterViewInit() {
		const preferencesEventBus: EventEmitter<any> = this.ow.getMainWindow().preferencesEventBus;
		console.log('registered prefs event bus', preferencesEventBus);
		this.preferencesSubscription = preferencesEventBus.subscribe(async event => {
			console.log('received pref event', event);
			if (event.name === PreferencesService.TWITCH_CONNECTION_STATUS) {
				await this.loadDefaultValues();
				console.log('broadcast prefs updated');
			}
		});
		this.cdr.detach();
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.preferencesSubscription?.unsubscribe();
	}

	connect() {
		this.ow.openUrlInOverwolfBrowser(this.twitchLoginUrl);
	}

	disconnect() {
		console.log('disconnecting twitch');
		this.prefs?.disconnectTwitch();
	}

	preventMiddleClick(event: MouseEvent) {
		// console.log('intercepting mouse click?', event);
		if (event.which === 2) {
			// console.log('preventing middle click on href, as it messes up with the windowing system');
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
	}

	private async loadDefaultValues() {
		this.twitchedLoggedIn = await this.twitch.isLoggedIn();
		this.twitchUserName = (await this.prefs.getPreferences()).twitchUserName;
		this.twitchLoginUrl = this.twitch.buildLoginUrl();
		console.log('twitch login url', this.twitchLoginUrl);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
