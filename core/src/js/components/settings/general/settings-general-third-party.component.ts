import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'settings-general-third-party',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/global/forms.scss`,
		`../../../../css/global/scrollbar-settings.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-third-party.component.scss`,
	],
	template: `
		<div class="general-third-party" *ngIf="{ oocLoggedIn: oocLoggedIn$ | async } as value" scrollable>
			<div class="intro" [owTranslate]="'settings.general.third-party.intro'"></div>
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
							<span [owTranslate]="'settings.general.third-party.ooc.connect-button-text'"></span>
						</button>
					</div>
					<div class="logged-in" *ngIf="oocLoginUrl && value.oocLoggedIn">
						<div class="user-name" [owTranslate]="'settings.general.third-party.ooc.connected-text'"></div>
						<button (mousedown)="oocDisconnect()">
							<span [owTranslate]="'settings.general.third-party.ooc.disconnect-button-text'"></span>
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
					<p [innerHTML]="hsdecks.next"></p>
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
	implements AfterContentInit, OnDestroy {
	oocLoggedIn$: Observable<boolean>;
	oocLoginUrl = `https://outof.cards/oauth/authorize/?client_id=oqEn7ONIAOmugFTjFQGe1lFSujGxf3erhNDDTvkC&response_type=code&scope=hearthcollection&redirect_uri=https://www.firestoneapp.com/ooc-login.html`;

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
		title: 'Out of Cards',
		icon: 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/third-party/out-of-cards.png',
		pitch: this.i18n.translateString('settings.general.third-party.ooc.pitch', {
			websiteLink: `<a href="https://outof.cards/hearthstone/" target="_blank">${this.i18n.translateString(
				'settings.general.third-party.ooc.website-link',
			)}</a>`,
		}),
		whatNext: this.i18n.translateString('settings.general.third-party.ooc.next'),
		toggleLabel: this.i18n.translateString('settings.general.third-party.ooc.toggle-label'),
	};
	d0nkey = {
		title: 'd0nkey.top',
		icon: 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/third-party/d0nkey.png',
		pitch: this.i18n.translateString('settings.general.third-party.d0nkey.pitch', {
			websiteLink: `<a href="https://www.d0nkey.top" target="_blank">${this.i18n.translateString(
				'settings.general.third-party.d0nkey.website-link',
			)}</a>`,
		}),
		whatNext: this.i18n.translateString('settings.general.third-party.d0nkey.next', {
			link: `<a href="https://www.d0nkey.top/streamer-instructions" target="_blank">${this.i18n.translateString(
				'settings.general.third-party.d0nkey.next-link',
			)}</a>`,
		}),
		toggleLabel: this.i18n.translateString('settings.general.third-party.d0nkey.toggle-label'),
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
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.oocLoggedIn$ = this.store
			.listenPrefs$((prefs) => prefs.outOfCardsToken)
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				map((token) => token?.access_token && token?.expires_timestamp > Date.now()),
				tap((filter) =>
					setTimeout(() => {
						if (!(this.cdr as ViewRef)?.destroyed) {
							this.cdr.detectChanges();
						}
					}, 0),
				),
				tap((filter) => cdLog('emitting oocLoggedIn in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
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
