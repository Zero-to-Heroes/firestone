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

@Component({
	selector: 'menu-selection',
	styleUrls: [`../../css/global/menu.scss`, `../../css/component/menu-selection.component.scss`],
	template: `
		<ul class="menu-selection">
			<li
				[ngClass]="{ 'selected': selectedModule === 'achievements' }"
				(mousedown)="selectModule('achievements')"
			>
				<span
					>Achievements
					<div *ngIf="!currentUser || !currentUser.username" class="attention-icon-container">
						<svg
							helpTooltip="Login to save your achievements online"
							helpTooltipPosition="right"
							class="svg-icon-fill attention-icon pulse"
							pulse="hasSeenAchievementsLoginButton"
							(click)="toggleLoginPopup()"
							[ngClass]="{ 'active': loginPopupActive }"
						>
							<use xlink:href="/Files/assets/svg/sprite.svg#attention" />
						</svg>
						<div class="login-conf-popup" *ngIf="loginPopupActive">
							<div class="text">Click on the icon to log in to Overwolf and save your achievements online</div>
							<div class="buttons">
								<button class="cancel" (click)="cancel()">Cancel</button>
								<button class="log-in" (click)="login()">Log in</button>
							</div>
							<svg class="svg-icon-fill tooltip-arrow" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0" />
							</svg>
						</div></div
				></span>
			</li>
			<li [ngClass]="{ 'selected': selectedModule === 'collection' }" (mousedown)="selectModule('collection')">
				<span>Collection</span>
			</li>
			<li [ngClass]="{ 'selected': selectedModule === 'decktracker' }" (mousedown)="selectModule('decktracker')">
				<span>Deck Tracker</span>
			</li>
			<li [ngClass]="{ 'selected': selectedModule === 'replays' }" (mousedown)="selectModule('replays')">
				<span>Replays</span>
			</li>
		</ul>
	`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSelectionComponent implements AfterViewInit {
	@Input() selectedModule: string;
	@Input() currentUser: CurrentUser;

	loginPopupActive: boolean;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	selectModule(module: string) {
		this.stateUpdater.next(new ChangeVisibleApplicationEvent(module));
	}

	toggleLoginPopup() {
		this.loginPopupActive = !this.loginPopupActive;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	cancel() {
		this.loginPopupActive = false;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	login() {
		this.ow.openLoginDialog();
		this.loginPopupActive = false;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
