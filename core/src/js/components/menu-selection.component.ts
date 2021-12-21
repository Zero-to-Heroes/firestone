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
import { FeatureFlags } from '../services/feature-flags';
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
		<ul class="menu-selection main-menu">
			<li [ngClass]="{ 'selected': selectedModule === 'decktracker' }" (mousedown)="selectModule('decktracker')">
				<div class="icon" inlineSVG="assets/svg/whatsnew/decktracker.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.constructed-header'"></div>
				</div>
			</li>
			<li
				[ngClass]="{ 'selected': selectedModule === 'battlegrounds' }"
				(mousedown)="selectModule('battlegrounds')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/battlegrounds.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.battlegrounds-header'"></div>
				</div>
			</li>
			<li
				[ngClass]="{ 'selected': selectedModule === 'mercenaries' }"
				(mousedown)="selectModule('mercenaries')"
				*ngIf="enableMercenariesTab"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/mercenaries.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.mercenaries-header'"></div>
				</div>
			</li>
			<li [ngClass]="{ 'selected': selectedModule === 'duels' }" (mousedown)="selectModule('duels')">
				<div class="icon" inlineSVG="assets/svg/whatsnew/duels.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.duels-header'"></div>
				</div>
			</li>
			<li [ngClass]="{ 'selected': selectedModule === 'arena' }" (mousedown)="selectModule('arena')">
				<div class="icon" inlineSVG="assets/svg/whatsnew/arena.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.arena-header'"></div>
				</div>
			</li>
			<li class="main-menu-separator"></li>
			<li
				class="arena"
				[ngClass]="{ 'selected': selectedModule === 'replays' }"
				(mousedown)="selectModule('replays')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/replays.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.replays-header'"></div>
				</div>
			</li>
			<li
				[ngClass]="{ 'selected': selectedModule === 'achievements' }"
				(mousedown)="selectModule('achievements')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/achievements.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.achievements-header'"></div>
				</div>
			</li>
			<li [ngClass]="{ 'selected': selectedModule === 'collection' }" (mousedown)="selectModule('collection')">
				<div class="icon" inlineSVG="assets/svg/whatsnew/collection.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.collection-header'"></div>
				</div>
			</li>
			<li
				[ngClass]="{ 'selected': selectedModule === 'stats' }"
				(mousedown)="selectModule('stats')"
				*ngIf="enableStatsTab"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/stats.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header" [owTranslate]="'app.menu.stats-header'"></div>
				</div>
			</li>

			<li class="push-down"></li>
			<ng-container *ngIf="showGoPremium">
				<li class="go-premium" (click)="goPremium()">
					<div class="icon" inlineSVG="assets/svg/whatsnew/go_premium.svg"></div>
					<div class="text">
						<div class="text-background"></div>
						<div class="menu-header" [owTranslate]="'app.menu.go-premium-header'"></div>
					</div>
				</li>
				<li class="main-menu-separator"></li>
			</ng-container>
			<li class="login-info" (click)="login()">
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
			</li>
		</ul>
	`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionComponent extends AbstractSubscriptionComponent implements AfterContentInit, AfterViewInit {
	enableStatsTab = FeatureFlags.ENABLE_STATS_TAB;
	enableMercenariesTab = FeatureFlags.ENABLE_MERCENARIES_TAB;

	userName$: Observable<string>;
	avatarUrl$: Observable<string>;

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
