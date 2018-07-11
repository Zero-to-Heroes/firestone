import { Component, HostListener, Input } from '@angular/core';

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
		</ng-container>
	`,
})

export class AchievementsMenuComponent {

	@Input() public displayType: string;
	@Input() public selectedCategory: AchievementSet;

	constructor(private _events: Events) {

	}
}
