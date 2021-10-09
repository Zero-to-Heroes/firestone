import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { CurrentAppType } from '../models/mainwindow/current-app.type';
import { CurrentUser } from '../models/overwolf/profile/current-user';
import { AdService } from '../services/ad.service';
import { FeatureFlags } from '../services/feature-flags';
import { ChangeVisibleApplicationEvent } from '../services/mainwindow/store/events/change-visible-application-event';
import { MainWindowStoreEvent } from '../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../services/overwolf.service';

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
					<div class="menu-header">Constructed</div>
					<!-- <div class="menu-text-details">See all your constructed stuff!</div> -->
				</div>
			</li>
			<li
				[ngClass]="{ 'selected': selectedModule === 'battlegrounds' }"
				(mousedown)="selectModule('battlegrounds')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/battlegrounds.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header">Battlegrounds</div>
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
					<div class="menu-header">Mercenaries</div>
				</div>
			</li>
			<li [ngClass]="{ 'selected': selectedModule === 'duels' }" (mousedown)="selectModule('duels')">
				<div class="icon" inlineSVG="assets/svg/whatsnew/duels.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header">Duels</div>
				</div>
			</li>
			<li [ngClass]="{ 'selected': selectedModule === 'arena' }" (mousedown)="selectModule('arena')">
				<div class="icon" inlineSVG="assets/svg/whatsnew/arena.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header">Arena</div>
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
					<div class="menu-header">Replays</div>
				</div>
			</li>
			<li
				[ngClass]="{ 'selected': selectedModule === 'achievements' }"
				(mousedown)="selectModule('achievements')"
			>
				<div class="icon" inlineSVG="assets/svg/whatsnew/achievements.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header">Achievements</div>
				</div>
			</li>
			<li [ngClass]="{ 'selected': selectedModule === 'collection' }" (mousedown)="selectModule('collection')">
				<div class="icon" inlineSVG="assets/svg/whatsnew/collection.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header">Collection</div>
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
					<div class="menu-header">Stats</div>
				</div>
			</li>

			<li class="push-down"></li>
			<ng-container *ngIf="showGoPremium">
				<li class="go-premium" (click)="goPremium()">
					<div class="icon" inlineSVG="assets/svg/whatsnew/go_premium.svg"></div>
					<div class="text">
						<div class="text-background"></div>
						<div class="menu-header">Support the dev and remove the ads</div>
					</div>
				</li>
				<li class="main-menu-separator"></li>
			</ng-container>
			<li class="login-info" (click)="login()">
				<img class="avatar" [src]="avatarUrl" />
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-text-details">
						{{
							_currentUser?.username
								? 'Logged in as ' + _currentUser.username
								: 'Log in to save your progress online'
						}}
					</div>
				</div>
			</li>
		</ul>
	`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionComponent implements AfterViewInit {
	enableStatsTab = FeatureFlags.ENABLE_STATS_TAB;
	enableMercenariesTab = FeatureFlags.ENABLE_MERCENARIES_TAB;

	@Input() selectedModule: string;

	@Input() set currentUser(value: CurrentUser) {
		this._currentUser = value;
		this.avatarUrl = value?.avatar?.length > 0 ? value.avatar : 'assets/images/social-share-login.png';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_currentUser: CurrentUser;
	showGoPremium: boolean;
	avatarUrl = 'assets/images/social-share-login.png';

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef, private adService: AdService) {}

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
