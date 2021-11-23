import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
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
			<div class="intro">
				We believe that your data belongs to you, and that you should be able to synchronize it to other third
				party websites and help them do whatever they do best with it. We don't get paid for this, but we do get
				some exposure since they then talk about us :)
			</div>
			<section class="vs">
				<h2>
					<img
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/third-party/vs.png?v=2"
						class="icon"
					/>
					Vicious Syndicate
				</h2>
				<div class="pitch">
					<p>
						Vicious Syndicate builds a weekly meta report that captures what the meta looks, using both data
						coming from thousands of games and insights by top-level players. You can visit them
						<a href="https://www.vicioussyndicate.com" target="_blank">here</a>.
					</p>
				</div>
				<div class="what-text">
					<p>
						If you decide to contribute to the vS Data Reaper Report, Firestone will anonymously send them
						info about your games (mostly the cards played by each player and some meta data, like player
						ranks).
					</p>
				</div>
				<preference-toggle
					class="enable-vs-button"
					field="shareGamesWithVS"
					label="Contribute to the vS Data Reaper Report"
				></preference-toggle>
			</section>
			<section class="out-of-cards">
				<h2>
					<img
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/third-party/out-of-cards.png?v=2"
						class="icon"
					/>Out of Cards
				</h2>
				<div class="pitch">
					<p>
						Out of Cards is a Hearthstone community site with articles, guides, decks, card database, and
						more. Syncing your card collection to the site makes it easier to find decks to play. You can
						visit them <a href="https://outof.cards/hearthstone/" target="_blank">here</a>.
					</p>
				</div>
				<div class="what-text">
					<p>
						If you connect your Out of Cards account, Firestone will send your collection data to Out of
						Cards so you can use it online.
					</p>
				</div>
				<div class="connect">
					<div class="logged-out" *ngIf="oocLoginUrl && !value.oocLoggedIn">
						<button (mousedown)="oocConnect()">
							<span>Connect</span>
						</button>
					</div>
					<div class="logged-in" *ngIf="oocLoginUrl && value.oocLoggedIn">
						<div class="user-name">You're logged in</div>
						<button (mousedown)="oocDisconnect()">
							<span>Disconnect</span>
						</button>
					</div>
				</div>
				<preference-toggle
					*ngIf="oocLoginUrl && value.oocLoggedIn"
					class="collection-sync-notif"
					field="outOfCardsShowNotifOnSync"
					label="Show notification when collection is synchronizeed"
				></preference-toggle>
			</section>
			<section class="vs">
				<h2>
					<img
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/third-party/d0nkey.png?v=2"
						class="icon"
					/>
					d0nkey.top
				</h2>
				<div class="pitch">
					<p>
						<a href="https://www.d0nkey.top" target="_blank">d0nkey.top</a> is a fan website that gathers
						all decks from official Hearthstone competitions, as well as decks from streamers to allow
						anyone to easily find interesting decks to play. Synchronizing to d0nkey.top will let you share
						your decks with your audience (if you're a streamer) or will help them build a better database
						to provide more free services to the community.
					</p>
				</div>
				<div class="what-text">
					<p>
						If you decide to sync to d0nkey.top, Firestone will send them each game you play, which will
						appear in a specific section on the website (which is still under construction). The replays
						will be private by default, unless you're streaming at the same time. See the
						<a href="https://www.d0nkey.top/streamer-instructions" target="_blank">instructions page</a> for
						how to set everything up.
					</p>
				</div>
				<preference-toggle
					class="enable-vs-button"
					field="d0nkeySync"
					label="Synchronize your replays to d0nkey.top"
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

	constructor(
		private prefs: PreferencesService,
		private ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
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
