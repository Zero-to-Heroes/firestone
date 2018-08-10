import { Component, Input, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';

declare var overwolf: any;

@Component({
	selector: 'achievement-set-view',
	styleUrls: [`../../../css/component/achievements/achievement-set.component.scss`],
	template: `
		<div *ngIf="_achievementSet" class="achievement-set">
			<div class="logo-container">
				<span class="text set-name">{{_achievementSet.displayName}}</span>
			</div>
			<span class="achieved">{{achieved}}/{{_achievementSet.achievements.length}}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementSetComponent {

	_achievementSet: AchievementSet;
	achieved: number;

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
		this.achieved = this._achievementSet.achievements
			.filter(achievement => achievement.numberOfCompletions > 0)
			.length;
	}
}
