import { Component, Input, ChangeDetectionStrategy, AfterViewInit, EventEmitter } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';

import { VisualAchievementCategory } from '../../models/visual-achievement-category';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ChangeVisibleApplicationEvent } from '../../services/mainwindow/store/events/change-visible-application-event';
import { SelectAchievementCategoryEvent } from '../../services/mainwindow/store/events/achievements/select-achievement-category-event';
import { SelectAchievementSetEvent } from '../../services/mainwindow/store/events/achievements/select-achievement-set-event';

declare var overwolf: any;

@Component({
	selector: 'achievements-menu',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/achievements/achievements-menu.component.scss`,
	],
	template: `
		<ng-container [ngSwitch]="displayType">
			<ul *ngSwitchCase="'menu'" class="menu-selection-achievements menu-selection">
				<li>Categories</li>
			</ul>
			<ul *ngSwitchCase="'breadcrumbs'" 
					class="menu-selection-achievements breadcrumbs"
					[ngClass]="{'big': !selectedAchievementSet}">
				<li (click)="goToAchievementsCategoriesView()">Categories</li>
				<li class="separator">></li>
                <li *ngIf="selectedCategory"
                        (click)="goToAchievementsCategoryView()" 
                        [ngClass]="{'unreachable': selectedCategory.achievementSets.length === 1}">
                    {{selectedCategory.name}}
                </li>
				<li class="separator" *ngIf="selectedAchievementSet">></li>
				<li class="unclickable" *ngIf="selectedAchievementSet" 
						(click)="goToAchievementSetView()">
					{{selectedAchievementSet.displayName}}
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
	
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;
	
	ngAfterViewInit() {
		this.stateUpdater = overwolf.windows.getMainWindow().mainWindowStoreUpdater;
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
}
