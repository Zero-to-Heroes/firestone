import { Component, NgZone, Input, SimpleChanges, ViewEncapsulation, ElementRef, AfterViewInit } from '@angular/core';

import { Achievement } from '../../models/achievement';
import { AchievementSet } from '../../models/achievement-set';

declare var overwolf: any;

@Component({
	selector: 'achievements-list',
	styleUrls: [`../../../css/component/achievements/achievements-list.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="achievements-container">
			<ul class="achievements-list" *ngIf="achievements">
				<li *ngFor="let achievement of achievements">
					<achievement-view [achievement]="achievement">/</achievement-view>
				</li>
			</ul>
		</div>
	`,
})
export class AchievementsListComponent {

	achievements: Achievement[];
	_achievementSet: AchievementSet;

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
	}

	@Input('achievementsList') set achievementsList(achievementsList: Achievement[]) {
		this.achievements = achievementsList;
	}
}
