import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';

import { Events } from '../../services/events.service';

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
			<ul *ngSwitchCase="'breadcrumbs'" class="menu-selection-achievements breadcrumbs">
				<li (click)="goToAchievementsCategoriesView()">Categories</li>
				<li class="separator">></li>
				<li class="unclickable" (click)="goToAchievementSetView()">{{selectedAchievementSet.displayName}}</li>
			</ul>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})

export class AchievementsMenuComponent {

	@Input() displayType: string;
	@Input() selectedAchievementSet: AchievementSet;

	constructor(private _events: Events) {

	}

	goToAchievementsCategoriesView() {
		this._events.broadcast(Events.MODULE_SELECTED, 'achievements');
	}

	goToAchievementSetView() {
		this._events.broadcast(Events.ACHIEVEMENT_SET_SELECTED, this.selectedAchievementSet);
	}
}
