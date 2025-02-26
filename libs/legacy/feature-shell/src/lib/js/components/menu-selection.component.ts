import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { CurrentAppType, PreferencesService } from '@firestone/shared/common/service';
import { AnalyticsService, OverwolfService, UserService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { AdService } from '../services/ad.service';
import { LocalizationFacadeService } from '../services/localization-facade.service';
import { ChangeVisibleApplicationEvent } from '../services/mainwindow/store/events/change-visible-application-event';
import { MainWindowStoreEvent } from '../services/mainwindow/store/events/main-window-store-event';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from './abstract-subscription-store.component';

@Component({
	selector: 'menu-selection',
	styleUrls: [`../../css/global/menu.scss`, `../../css/component/main-menu.component.scss`],
	template: `
		<nav class="menu-selection main-menu">
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.constructed-header' | owTranslate"
				[ngClass]="{ selected: selectedModule === 'decktracker' }"
				(click)="selectModule('decktracker')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/decktracker.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.constructed-header'"></div>
				</div>
			</button>
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.battlegrounds-header' | owTranslate"
				[ngClass]="{ selected: selectedModule === 'battlegrounds' }"
				(click)="selectModule('battlegrounds')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/battlegrounds.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.battlegrounds-header'"></div>
				</div>
			</button>
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.arena-header' | owTranslate"
				[ngClass]="{ selected: selectedModule === 'arena' }"
				(click)="selectModule('arena')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/arena.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.arena-header'"></div>
				</div>
			</button>
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item tavern-brawl"
				[attr.aria-label]="'app.menu.tavern-brawl-header' | owTranslate"
				[ngClass]="{ selected: selectedModule === 'tavern-brawl' }"
				(click)="selectModule('tavern-brawl')"
			>
				<div class="icon" inlineSVG="assets/svg/tavern_brawl.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.tavern-brawl-header'"></div>
				</div>
			</button>
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.mercenaries-header' | owTranslate"
				[ngClass]="{ selected: selectedModule === 'mercenaries' }"
				(click)="selectModule('mercenaries')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/mercenaries.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.mercenaries-header'"></div>
				</div>
			</button>

			<li class="main-menu-separator"></li>

			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.replays-header' | owTranslate"
				[ngClass]="{ selected: selectedModule === 'replays' }"
				(click)="selectModule('replays')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/replays.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.replays-header'"></div>
				</div>
			</button>
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.achievements-header' | owTranslate"
				[ngClass]="{ selected: selectedModule === 'achievements' }"
				(click)="selectModule('achievements')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/achievements.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.achievements-header'"></div>
				</div>
			</button>
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.collection-header' | owTranslate"
				[ngClass]="{ selected: selectedModule === 'collection' }"
				(click)="selectModule('collection')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/collection.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.collection-header'"></div>
				</div>
			</button>

			<li class="main-menu-separator"></li>

			<button
				tabindex="-1"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.profile-header' | owTranslate"
				[ngClass]="{ selected: selectedModule === 'profile' }"
				(click)="selectModule('profile')"
			>
				<div class="icon" inlineSVG="assets/svg/profile.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.profile-header'"></div>
				</div>
			</button>
			<button
				tabindex="-1"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.communities-header' | owTranslate"
				[ngClass]="{ selected: selectedModule === 'communities' }"
				(click)="selectModule('communities')"
			>
				<div class="icon" inlineSVG="assets/svg/community.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.communities-header'"></div>
				</div>
			</button>
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.streams-header' | owTranslate"
				[ngClass]="{ selected: selectedModule === 'streams' }"
				(click)="selectModule('streams')"
			>
				<div class="icon" inlineSVG="assets/svg/streams.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.streams-header'"></div>
				</div>
			</button>

			<li class="push-down"></li>
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item go-premium"
				[attr.aria-label]="'app.menu.go-premium-header' | owTranslate"
				(click)="goPremium()"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/go_premium.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.go-premium-header'"></div>
				</div>
			</button>
			<li class="main-menu-separator"></li>

			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item login-info"
				[attr.aria-label]="'Login / Logout'"
				(click)="login()"
			>
				<img class="avatar" [src]="avatarUrl$ | async" />
				<div class="text">
					<div class="text-background"></div>
					<div
						class="menu-text-details"
						*ngIf="{ userName: userName$ | async } as value"
						[owTranslate]="
							value.userName ? 'app.menu.logged-in-as-header' : 'app.menu.not-logged-in-header'
						"
						[translateParams]="{ value: value.userName }"
					></div>
				</div>
			</button>
		</nav>
	`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	enableMailboxTab$: Observable<boolean>;
	userName$: Observable<string>;
	avatarUrl$: Observable<string>;
	tabIndex$: Observable<number>;
	hasNewMail$: Observable<boolean>;
	mailboxTextDetails$: Observable<string>;

	@Input() selectedModule: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
		private readonly analytics: AnalyticsService,
		private readonly userService: UserService,
		private readonly ads: AdService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.userService, this.ads, this.prefs);

		this.userName$ = this.userService.user$$.pipe(this.mapData((currentUser) => currentUser?.username));
		this.avatarUrl$ = this.userService.user$$.pipe(
			this.mapData(
				(currentUser) =>
					currentUser?.avatar ||
					'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/social-share-login.png',
			),
		);
		this.tabIndex$ = this.store
			.listen$(([main, nav]) => main.showFtue)
			.pipe(this.mapData(([showFtue]) => (showFtue ? -1 : 0)));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectModule(module: CurrentAppType) {
		this.analytics.trackEvent('app-navigation', { section: module });
		this.stateUpdater.next(new ChangeVisibleApplicationEvent(module));
	}

	login() {
		this.ow.openLoginDialog();
	}

	goPremium() {
		this.analytics.trackEvent('subscription-click', { page: 'left-menu' });
		this.ads.goToPremium();
	}
}
