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
			<ul *ngSwitchCase="'menu'" class="menu-selection">
				<li class="selected">Achievements</li>
			</ul>
			<ng-container *ngSwitchCase="'breadcrumbs'">
				<ul class="breadcrumbs">
					<li (click)="goToAchievementsHomeView()">Achievements</li>
					<li (click)="goToAchievementsSetsView()" *ngIf="selectedAchievementSet">{{selectedAchievementSet.displayName}}</li>
				</ul>
			</ng-container>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})

export class AchievementsMenuComponent {

	@Input() displayType: string;
	@Input() selectedAchievementSet: AchievementSet;

	constructor(private _events: Events) {

	}

	goToAchievementsHomeView() {
		this._events.broadcast(Events.MODULE_SELECTED, 'achievements');
	}

	goToAchievementsSetsView() {
		this._events.broadcast(Events.ACHIEVEMENT_SET_SELECTED, this.selectedAchievementSet);
	}
}
