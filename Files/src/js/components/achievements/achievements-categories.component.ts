import { Component, NgZone, OnInit, Input } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';

import { Events } from '../../services/events.service';

declare var overwolf: any;

@Component({
	selector: 'achievements-categories',
	styleUrls: [
		`../../../css/component/achievements/achievements-categories.component.scss`,
		`../../../css/global/scrollbar.scss`
	],
	template: `
		<div class="achievements-categories">
			<ol>
				<li *ngFor="let achievementSet of achievementSets">
					<achievement-set-view [achievementSet]="achievementSet" (click)="selectSet(achievementSet)"></achievement-set-view>
				</li>
			</ol>
		</div>
	`,
})
// 7.1.1.17994
export class AchievementsCategoriesComponent {

	@Input() public achievementSets: AchievementSet[];

	constructor(private _events: Events) {
	}

	selectSet(set: AchievementSet) {
		this._events.broadcast(Events.ACHIEVEMENT_SET_SELECTED, set);
	}
}
