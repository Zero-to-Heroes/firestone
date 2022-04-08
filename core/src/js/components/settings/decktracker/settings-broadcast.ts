import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { TwitchAuthService } from '../../../services/mainwindow/twitch-auth.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

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
		<div
			class="decktracker-broadcast"
			*ngIf="{
				twitchUserName: twitchUserName$ | async
			} as value"
			scrollable
		>
			<section>
				<h2 [owTranslate]="'settings.general.twitch.title'"></h2>
				<p class="text" [owTranslate]="'settings.general.twitch.intro'"></p>
				<ol class="todo">
					<li>
						{{ 'settings.general.twitch.todo-1' | owTranslate }}
						<a
							href="https://www.twitch.tv/ext/jbmhw349lqbus9j8tx4wac18nsja9u"
							target="_blank"
							(mousedown)="preventMiddleClick($event)"
							(click)="preventMiddleClick($event)"
							(auxclick)="preventMiddleClick($event)"
							>{{ 'settings.general.twitch.link' | owTranslate }}</a
						>
					</li>
					<li [owTranslate]="'settings.general.twitch.todo-2'"></li>
					<li>
						{{ 'settings.general.twitch.todo-3' | owTranslate }}
						<a
							href="https://github.com/Zero-to-Heroes/firestone/wiki/Setting-up-the-Twitch-extension"
							target="_blank"
							(mousedown)="preventMiddleClick($event)"
							(click)="preventMiddleClick($event)"
							(auxclick)="preventMiddleClick($event)"
							>{{ 'settings.general.twitch.link' | owTranslate }}</a
						>
					</li>
				</ol>

				<div class="twitch logged-out" *ngIf="twitchLoginUrl && !twitchedLoggedIn">
					<button (mousedown)="connect()" class="text">
						<i class="twitch-icon">
							<svg>
								<use xlink:href="assets/svg/sprite.svg#twitch" />
							</svg>
						</i>
						<span [owTranslate]="'settings.general.twitch.login-button-text'"></span>
					</button>
				</div>
				<div class="twitch logged-in" *ngIf="twitchLoginUrl && twitchedLoggedIn">
					<div class="user-name">
						{{ 'settings.general.twitch.logged-in-as-text' | owTranslate }}
						<a
							href="https://www.twitch.tv/{{ value.twitchUserName }}"
							target="_blank"
							(mousedown)="preventMiddleClick($event)"
							(click)="preventMiddleClick($event)"
							(auxclick)="preventMiddleClick($event)"
							>{{ value.twitchUserName }}</a
						>
					</div>
					<button (mousedown)="disconnect()" class="text">
						<i class="twitch-icon">
							<svg>
								<use xlink:href="assets/svg/sprite.svg#twitch" />
							</svg>
						</i>
						<span [owTranslate]="'settings.general.twitch.logout-button-text'"></span>
					</button>
				</div>
			</section>

			<section>
				<h2 class="title" [owTranslate]="'settings.general.twitch.configuration-title'"></h2>
				<div class="settings-group">
					<preference-numeric-input
						[label]="'settings.general.twitch.delay-label' | owTranslate"
						[tooltip]="'settings.general.twitch.delay-label-tooltip' | owTranslate"
						[field]="'twitchDelay'"
						[minValue]="0"
						[incrementStep]="100"
					></preference-numeric-input>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsBroadcastComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	twitchUserName$: Observable<string>;

	twitchedLoggedIn: boolean;
	twitchLoginUrl: string;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly twitch: TwitchAuthService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		this.twitchUserName$ = this.listenForBasicPref$((prefs) => prefs.twitchUserName);
		this.store
			.listenPrefs$((prefs) => prefs.twitchAccessToken)
			.pipe(this.mapData(([pref]) => pref))
			.subscribe(async (token) => {
				this.twitchedLoggedIn = await this.twitch.isLoggedIn();
				this.twitchLoginUrl = this.twitch.buildLoginUrl();
				this.cdr?.detectChanges();
			});
	}

	connect() {
		this.ow.openUrlInDefaultBrowser(this.twitchLoginUrl);
	}

	disconnect() {
		console.log('disconnecting twitch');
		this.prefs?.disconnectTwitch();
	}

	preventMiddleClick(event: MouseEvent) {
		if (event.which === 2) {
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
	}
}
