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
import { ILocalizationService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	selector: 'settings-general-third-party',
	styleUrls: [
		`../scrollbar-settings.scss`,
		`../../../settings-common.component.scss`,
		`./settings-general-third-party.component.scss`,
	],
	template: `
		<div class="general-third-party" *ngIf="{ oocLoggedIn: oocLoggedIn$ | async } as value" scrollable>
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

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.oocLoggedIn$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.outOfCardsToken),
			this.mapData((token) => !!token?.access_token && token?.expires_timestamp > Date.now()),
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

	oocDisconnect() {
		console.log('disconnecting out of cards');
		this.prefs.udpateOutOfCardsToken(null);
	}
}
