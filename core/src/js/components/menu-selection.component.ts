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
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { CurrentAppType } from '../models/mainwindow/current-app.type';
import { AdService } from '../services/ad.service';
import { ChangeVisibleApplicationEvent } from '../services/mainwindow/store/events/change-visible-application-event';
import { MainWindowStoreEvent } from '../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../services/overwolf.service';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from './abstract-subscription.component';

declare let amplitude;

@Component({
	selector: 'menu-selection',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/global/menu.scss`,
		`../../css/component/main-menu.component.scss`,
	],
	template: `
		<nav class="menu-selection main-menu">
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.constructed-header' | owTranslate"
				[ngClass]="{ 'selected': selectedModule === 'decktracker' }"
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
				[ngClass]="{ 'selected': selectedModule === 'battlegrounds' }"
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
				[attr.aria-label]="'app.menu.mercenaries-header' | owTranslate"
				[ngClass]="{ 'selected': selectedModule === 'mercenaries' }"
				(click)="selectModule('mercenaries')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/mercenaries.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.mercenaries-header'"></div>
				</div>
			</button>

			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.duels-header' | owTranslate"
				[ngClass]="{ 'selected': selectedModule === 'duels' }"
				(click)="selectModule('duels')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/duels.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.duels-header'"></div>
				</div>
			</button>
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.arena-header' | owTranslate"
				[ngClass]="{ 'selected': selectedModule === 'arena' }"
				(click)="selectModule('arena')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/arena.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.arena-header'"></div>
				</div>
			</button>
			<li class="main-menu-separator"></li>
			<button
				[attr.tabindex]="tabIndex$ | async"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.replays-header' | owTranslate"
				[ngClass]="{ 'selected': selectedModule === 'replays' }"
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
				[ngClass]="{ 'selected': selectedModule === 'achievements' }"
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
				[ngClass]="{ 'selected': selectedModule === 'collection' }"
				(click)="selectModule('collection')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/collection.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.collection-header'"></div>
				</div>
			</button>
			<button
				tabindex="-1"
				type="button"
				class="menu-item"
				[attr.aria-label]="'app.menu.stats-header' | owTranslate"
				[ngClass]="{ 'selected': selectedModule === 'stats' }"
				(click)="selectModule('stats')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/stats.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.stats-header'"></div>
				</div>
			</button>

			<li class="push-down"></li>
			<ng-container *ngIf="showGoPremium">
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
			</ng-container>

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
export class MenuSelectionComponent extends AbstractSubscriptionComponent implements AfterContentInit, AfterViewInit {
	userName$: Observable<string>;
	avatarUrl$: Observable<string>;
	tabIndex$: Observable<number>;

	@Input() selectedModule: string;

	showGoPremium: boolean;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private ow: OverwolfService,
		private adService: AdService,
		private readonly translate: TranslateService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.userName$ = this.store
			.listen$(([main, nav, prefs]) => main.currentUser)
			.pipe(this.mapData(([currentUser]) => currentUser?.username));
		this.avatarUrl$ = this.store
			.listen$(([main, nav, prefs]) => main.currentUser)
			.pipe(this.mapData(([currentUser]) => currentUser?.avatar ?? 'assets/images/social-share-login.png'));
		this.tabIndex$ = this.store
			.listen$(([main, nav]) => main.showFtue)
			.pipe(this.mapData(([showFtue]) => (showFtue ? -1 : 0)));
	}

	async ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.showGoPremium = await this.adService.shouldDisplayAds();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	selectModule(module: CurrentAppType) {
		this.stateUpdater.next(new ChangeVisibleApplicationEvent(module));
	}

	login() {
		this.ow.openLoginDialog();
	}

	goPremium() {
		amplitude.getInstance().logEvent('subscription-click', { 'page': 'left-menu' });
		this.ow.openStore();
	}
}
