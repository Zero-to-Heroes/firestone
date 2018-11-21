import { Component, Input, SimpleChanges, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';

import { AchievementSet } from '../../models/achievement-set';

@Component({
	selector: 'achievement-progress-bar',
	styleUrls: [`../../../css/component/achievements/achievement-progress-bar.component.scss`],
	template: `
		<div class="achievement-progress-bar">
			<span class="achieved">{{achieved}}/{{total}}</span>
			<div class="progress-bar">
				<div class="progress" [style.width.%]="100.0 * achieved / total"></div>
			</div>
		</div>
	`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementProgressBarComponent {

	achieved: number;
	total: number;

	@Input('achievementSet') set achievementSet(achievementSet: AchievementSet) {
		const flatCompletions = achievementSet.achievements
				.map((achievement) => achievement.completionSteps)
				.reduce((a, b) => a.concat(b));
		this.total = flatCompletions.length;
		this.achieved = flatCompletions.map((step) => step.numberOfCompletions).filter((a) => a > 0).length;
		console.log('set achievement in progress bar', achievementSet);
	}
}
