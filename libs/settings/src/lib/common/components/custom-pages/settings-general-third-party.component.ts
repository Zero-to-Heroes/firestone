import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ApiRunner,
	ILocalizationService,
	OverwolfService,
	UserService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { interval, Observable, Subscription } from 'rxjs';

@Component({
	standalone: false,
	selector: 'settings-general-third-party',
	styleUrls: [
		`../scrollbar-settings.scss`,
		`../../../settings-common.component.scss`,
		`./settings-general-third-party.component.scss`,
	],
	template: `
		<div
			class="general-third-party"
			*ngIf="{
				oocLoggedIn: oocLoggedIn$,
				hearthpwnLoggedIn: hearthpwnLoggedIn$ | async,
				hearthpwnLoginUrl: hearthpwnLoginUrl$ | async,
			} as value"
			scrollable
		>
			<div class="intro" [fsTranslate]="'settings.general.third-party.intro'"></div>
			<section class="vs">
				<h2>
					<img [src]="vs.icon" class="icon" />
					{{ vs.title }}
				</h2>
				<div class="pitch">
					<p [innerHTML]="vs.pitch"></p>
				</div>
				<div class="what-text">
					<p [innerHTML]="vs.whatNext"></p>
				</div>
				<preference-toggle
					class="enable-vs-button"
					field="shareGamesWithVS"
					[label]="vs.toggleLabel"
				></preference-toggle>
			</section>
			<section class="out-of-cards">
				<h2><img [src]="ooc.icon" class="icon" />{{ ooc.title }}</h2>
				<div class="pitch">
					<p [innerHTML]="ooc.pitch"></p>
				</div>
				<div class="what-text">
					<p [innerHTML]="ooc.whatNext"></p>
				</div>
				<div class="connect">
					<div class="logged-out" *ngIf="oocLoginUrl && !value.oocLoggedIn">
						<button (mousedown)="oocConnect()">
							<span [fsTranslate]="'settings.general.third-party.ooc.connect-button-text'"></span>
						</button>
					</div>
					<div class="logged-in" *ngIf="oocLoginUrl && value.oocLoggedIn">
						<div class="user-name" [fsTranslate]="'settings.general.third-party.ooc.connected-text'"></div>
						<button (mousedown)="oocDisconnect()">
							<span [fsTranslate]="'settings.general.third-party.ooc.disconnect-button-text'"></span>
						</button>
					</div>
				</div>
				<preference-toggle
					*ngIf="oocLoginUrl && value.oocLoggedIn"
					class="collection-sync-notif"
					field="outOfCardsShowNotifOnSync"
					[label]="ooc.toggleLabel"
				></preference-toggle>
			</section>
			<section class="vs">
				<h2>
					<img [src]="d0nkey.icon" class="icon" />
					{{ d0nkey.title }}
				</h2>
				<div class="pitch">
					<p [innerHTML]="d0nkey.pitch"></p>
				</div>
				<div class="what-text">
					<p [innerHTML]="d0nkey.whatNext"></p>
				</div>
				<preference-toggle
					class="enable-vs-button"
					field="d0nkeySync"
					[label]="d0nkey.toggleLabel"
				></preference-toggle>
				<preference-toggle
					class="enable-vs-button"
					field="hsGuruCollectionSync"
					[label]="d0nkey.toggleCollectionLabel"
				></preference-toggle>
			</section>

			<section class="vs">
				<h2>
					<img [src]="hsdecks.icon" class="icon" />
					{{ hsdecks.title }}
				</h2>
				<div class="pitch">
					<p [innerHTML]="hsdecks.pitch"></p>
				</div>
				<div class="what-text">
					<p [innerHTML]="hsdecks.whatNext"></p>
				</div>
				<preference-toggle
					class="enable-vs-button"
					field="hearthstoneDecksSync"
					[label]="hsdecks.toggleLabel"
				></preference-toggle>
			</section>

			<!-- <section class="hearthpwn">
				<h2><img [src]="" class="icon" />{{ hearthpwn.title }}</h2>
				<div class="pitch">
					<p [innerHTML]="hearthpwn.pitch"></p>
				</div>
				<div class="what-text">
					<p [innerHTML]="hearthpwn.whatNext"></p>
				</div>
				<div class="connect">
					{{ value.hearthpwnLoginUrl }}
					{{ value.hearthpwnLoggedIn }}
					<div class="logged-out" *ngIf="value.hearthpwnLoginUrl && !value.hearthpwnLoggedIn">
						<button (mousedown)="hearthpwnConnect(value.hearthpwnLoginUrl)">
							<span [fsTranslate]="'settings.general.third-party.ooc.connect-button-text'"></span>
						</button>
					</div>
					<div class="logged-in" *ngIf="value.hearthpwnLoginUrl && value.hearthpwnLoggedIn">
						<div class="user-name" [fsTranslate]="'settings.general.third-party.ooc.connected-text'"></div>
						<button (mousedown)="hearthpwnDisconnect()">
							<span [fsTranslate]="'settings.general.third-party.ooc.disconnect-button-text'"></span>
						</button>
					</div>
				</div>
				<preference-toggle
					*ngIf="value.hearthpwnLoginUrl && value.hearthpwnLoggedIn"
					class="collection-sync-notif"
					field="hearthpwnShowNotifOnSync"
					[label]="hearthpwn.toggleLabel"
				></preference-toggle>
			</section> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralThirdPartyComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	oocLoggedIn$: Observable<boolean>;
	oocLoginUrl = `https://outof.games/oauth/authorize/?client_id=oqEn7ONIAOmugFTjFQGe1lFSujGxf3erhNDDTvkC&response_type=code&scope=hearthcollection&redirect_uri=https://www.firestoneapp.com/oog-login.html`;

	hearthpwnLoggedIn$: Observable<boolean>;
	hearthpwnLoginUrl$: Observable<string>;

	vs = {
		title: 'Vicious Syndicate',
		icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/third-party/vs.png`,
		pitch: this.i18n.translateString('settings.general.third-party.vs.pitch', {
			websiteLink: `<a href="https://www.vicioussyndicate.com" target="_blank">${this.i18n.translateString(
				'settings.general.third-party.vs.website-link',
			)}</a>`,
		}),
		whatNext: this.i18n.translateString('settings.general.third-party.vs.next'),
		toggleLabel: this.i18n.translateString('settings.general.third-party.vs.toggle-label'),
	};
	ooc = {
		title: 'Out of Games',
		icon: 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/third-party/out-of-cards.png',
		pitch: this.i18n.translateString('settings.general.third-party.ooc.pitch', {
			websiteLink: `<a href="https://outof.games/hearthstone/" target="_blank">${this.i18n.translateString(
				'settings.general.third-party.ooc.website-link',
			)}</a>`,
		}),
		whatNext: this.i18n.translateString('settings.general.third-party.ooc.next'),
		toggleLabel: this.i18n.translateString('settings.general.third-party.ooc.toggle-label'),
	};
	hearthpwn = {
		title: 'Hearthpwn',
		icon: 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/third-party/hearthpwn.png',
		pitch: this.i18n.translateString('settings.general.third-party.hearthpwn.pitch', {
			websiteLink: `<a href="https://www.hearthpwn.com" target="_blank">${this.i18n.translateString(
				'settings.general.third-party.hearthpwn.website-link',
			)}</a>`,
		}),
		whatNext: this.i18n.translateString('settings.general.third-party.hearthpwn.next'),
		toggleLabel: this.i18n.translateString('settings.general.third-party.hearthpwn.toggle-label'),
	};
	d0nkey = {
		title: 'hsguru.com',
		icon: 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/third-party/d0nkey.png',
		pitch: this.i18n.translateString('settings.general.third-party.d0nkey.pitch', {
			websiteLink: `<a href="https://www.hsguru.com" target="_blank">${this.i18n.translateString(
				'settings.general.third-party.d0nkey.website-link',
			)}</a>`,
		}),
		whatNext: this.i18n.translateString('settings.general.third-party.d0nkey.next', {
			link: `<a href="https://www.hsguru.com/streamer-instructions" target="_blank">${this.i18n.translateString(
				'settings.general.third-party.d0nkey.instructions-page-link',
			)}</a>`,
		}),
		toggleLabel: this.i18n.translateString('settings.general.third-party.d0nkey.toggle-label'),
		toggleCollectionLabel: this.i18n.translateString('settings.general.third-party.d0nkey.toggle-collection-label'),
	};
	hsdecks = {
		title: 'Hearthstone-decks',
		icon: 'https://hearthstone-decks.net/wp-content/uploads/2021/12/Logo.png',
		pitch: this.i18n.translateString('settings.general.third-party.hsdecks.pitch', {
			websiteLink: `<a href="https://hearthstone-decks.net" target="_blank">${this.i18n.translateString(
				'settings.general.third-party.hsdecks.website-link',
			)}</a>`,
		}),
		whatNext: this.i18n.translateString('settings.general.third-party.hsdecks.next'),
		toggleLabel: this.i18n.translateString('settings.general.third-party.hsdecks.toggle-label'),
	};

	private hearthpwnSub: Subscription;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly i18n: ILocalizationService,
		private readonly userService: UserService,
		private readonly api: ApiRunner,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.userService);

		this.oocLoggedIn$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.outOfCardsToken),
			this.mapData((token) => !!token?.access_token && token?.expires_timestamp > Date.now()),
		);
		this.hearthpwnLoggedIn$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => !!prefs.hearthpwnAuthToken));
		this.hearthpwnLoginUrl$ = this.userService.user$$.pipe(
			this.mapData((user) => user?.userId?.replaceAll('-', '').replaceAll('_', '').replaceAll(' ', '')),
			this.mapData((userId) => `firestone${userId}`),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async oocConnect() {
		await this.ow.obtainDeclaredWindow('OutOfCardsAuthWindow');
		await this.ow.restoreWindow('OutOfCardsAuthWindow');
		await this.ow.bringToFront('OutOfCardsAuthWindow');
	}

	async hearthpwnConnect(loginToken: string) {
		this.ow.openUrlInDefaultBrowser(`https://www.hearthpwn.com/set-auth/${loginToken}`);
		this.hearthpwnSub = interval(5000).subscribe(async () => {
			const url = `https://www.hearthpwn.com/get-auth-info/${loginToken}`;
			const apiResult = await this.api.callGetApi(url);
			console.debug('[hearthpwn] api result', apiResult);
			if (apiResult) {
				this.hearthpwnSub.unsubscribe();
			}
		});
	}

	oocDisconnect() {
		console.log('disconnecting out of cards');
		this.prefs.udpateOutOfCardsToken(null);
	}

	hearthpwnDisconnect() {
		console.warn('[hearthpwn] disconnecting hearthpwn, NOT IMPLEMENTED YET');
	}

	override ngOnDestroy(): void {
		super.ngOnDestroy();
		this.hearthpwnSub?.unsubscribe();
	}
}
