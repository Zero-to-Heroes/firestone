import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';

import { Events } from '../../services/events.service';
import { VisualAchievementCategory } from '../../models/visual-achievement-category';

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
				<li (click)="goToAchievementsCategoryView()" *ngIf="selectedCategory">{{selectedCategory.name}}</li>
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

export class AchievementsMenuComponent {

	@Input() displayType: string;
	@Input() selectedCategory: VisualAchievementCategory;
	@Input() selectedAchievementSet: AchievementSet;

	constructor(private _events: Events) {

	}

	goToAchievementsCategoriesView() {
		this._events.broadcast(Events.MODULE_SELECTED, 'achievements');
	}

	goToAchievementsCategoryView() {
		this._events.broadcast(Events.ACHIEVEMENT_CATEGORY_SELECTED, this.selectedCategory);
	}

	goToAchievementSetView() {
		this._events.broadcast(Events.ACHIEVEMENT_SET_SELECTED, this.selectedAchievementSet);
	}
}
