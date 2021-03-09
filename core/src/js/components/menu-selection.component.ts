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
import { CurrentUser } from '../models/overwolf/profile/current-user';
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
					<div class="menu-text-details">See all your constructed stuff!</div>
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
			<li [ngClass]="{ 'selected': selectedModule === 'duels' }" (mousedown)="selectModule('duels')">
				<div class="icon" inlineSVG="assets/svg/whatsnew/duels.svg"></div>
				<div class="text">
					<div class="text-background"></div>
					<div class="menu-header">Duels</div>
				</div>
			</li>
			<li class="main-menu-separator"></li>
			<li [ngClass]="{ 'selected': selectedModule === 'replays' }" (mousedown)="selectModule('replays')">
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
	@Input() selectedModule: string;

	@Input() set currentUser(value: CurrentUser) {
		console.debug('setting current user', value);
		this._currentUser = value;
		this.avatarUrl = value?.avatar?.length > 0 ? value.avatar : 'assets/images/social-share-login.png';
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_currentUser: CurrentUser;
	avatarUrl = 'assets/images/social-share-login.png';

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectModule(module: string) {
		this.stateUpdater.next(new ChangeVisibleApplicationEvent(module));
	}

	login() {
		this.ow.openLoginDialog();
	}
}
