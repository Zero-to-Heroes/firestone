import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { AchievementSet } from '../../models/achievement-set';
import { CurrentUser } from '../../models/overwolf/profile/current-user';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { SelectAchievementCategoryEvent } from '../../services/mainwindow/store/events/achievements/select-achievement-category-event';
import { SelectAchievementSetEvent } from '../../services/mainwindow/store/events/achievements/select-achievement-set-event';
import { ChangeVisibleApplicationEvent } from '../../services/mainwindow/store/events/change-visible-application-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'achievements-menu',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/achievements/achievements-menu.component.scss`,
	],
	template: `
		<ng-container [ngSwitch]="displayType">
			<ul *ngSwitchCase="'menu'" class="menu-selection-achievements menu-selection">
				<li>
					Categories
					<div *ngIf="!currentUser || !currentUser.username" class="attention-icon-container">
						<svg
							helpTooltip="Login to save your achievements online"
							helpTooltipPosition="right"
							class="svg-icon-fill attention-icon pulse"
							(click)="toggleLoginPopup()"
							[ngClass]="{ 'active': loginPopupActive }"
						>
							<use xlink:href="/Files/assets/svg/sprite.svg#attention" />
						</svg>
						<div class="login-conf-popup" *ngIf="loginPopupActive">
							<div class="text">Log in to Overwolf to save your achievements online</div>
							<div class="buttons">
								<button class="cancel" (click)="cancel()">Cancel</button>
								<button class="log-in" (click)="login()">Log in</button>
							</div>
							<svg class="svg-icon-fill tooltip-arrow" viewBox="0 0 16 9">
								<polygon points="0,0 8,-9 16,0" />
							</svg>
						</div>
					</div>
				</li>
			</ul>
			<ul
				*ngSwitchCase="'breadcrumbs'"
				class="menu-selection-achievements breadcrumbs"
				[ngClass]="{ 'big': !selectedAchievementSet }"
			>
				<li (mousedown)="goToAchievementsCategoriesView()">Categories</li>
				<li class="separator">></li>
				<li
					*ngIf="selectedCategory"
					(mousedown)="goToAchievementsCategoryView()"
					[ngClass]="{ 'unreachable': selectedCategory.achievementSets.length === 1 }"
				>
					{{ selectedCategory.name }}
				</li>
				<li class="separator" *ngIf="selectedAchievementSet">></li>
				<li class="unclickable" *ngIf="selectedAchievementSet" (mousedown)="goToAchievementSetView()">
					{{ selectedAchievementSet.displayName }}
				</li>
			</ul>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementsMenuComponent implements AfterViewInit {
	@Input() displayType: string;
	@Input() selectedCategory: VisualAchievementCategory;
	@Input() selectedAchievementSet: AchievementSet;
	@Input() currentUser: CurrentUser;

	loginPopupActive: boolean;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	goToAchievementsCategoriesView() {
		this.stateUpdater.next(new ChangeVisibleApplicationEvent('achievements'));
	}

	goToAchievementsCategoryView() {
		if (this.selectedCategory.achievementSets.length === 1) {
			return;
		}
		this.stateUpdater.next(new SelectAchievementCategoryEvent(this.selectedCategory.id));
	}

	goToAchievementSetView() {
		this.stateUpdater.next(new SelectAchievementSetEvent(this.selectedAchievementSet.id));
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
