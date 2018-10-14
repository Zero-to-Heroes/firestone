import { Component, Input, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';

declare var overwolf: any;

@Component({
	selector: 'achievement-set-view',
	styleUrls: [`../../../css/component/achievements/achievement-set.component.scss`],
	template: `
		<div *ngIf="_achievementSet" class="achievement-set">
			<span class="text set-name">{{_achievementSet.displayName}}</span>
			<div class="logo"></div>
			<span class="achieved">{{achieved}}/{{total}}</span>
			<div class="progress-bar">
				<div class="progress" [style.width.%]="100.0 * achieved / total"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementSetComponent {

	_achievementSet: AchievementSet;
	achieved: number;
	total: number;

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		this._achievementSet = achievementSet;
		const flatCompletions = this._achievementSet.achievements
				.map((achievement) => achievement.numberOfCompletions)
				.reduce((a, b) => a.concat(b));
		this.total = flatCompletions.length;
		this.achieved = flatCompletions.filter((a) => a > 0).length;
		console.log('set achievementSet', this._achievementSet, flatCompletions, this.total, this.achieved);
	}
}
