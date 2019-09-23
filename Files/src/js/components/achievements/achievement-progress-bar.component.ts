import { Component, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { VisualAchievement } from '../../models/visual-achievement';

@Component({
	selector: 'achievement-progress-bar',
	styleUrls: [`../../../css/component/achievements/achievement-progress-bar.component.scss`],
	template: `
		<div class="achievement-progress-bar">
			<span class="achieved">{{ achieved }}/{{ total }}</span>
			<div class="progress-bar">
				<div class="progress" [style.width.%]="(100.0 * achieved) / total"></div>
			</div>
		</div>
	`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementProgressBarComponent {
	achieved: number;
	total: number;

	@Input('achievements') set achievements(achievements: readonly VisualAchievement[]) {
		if (achievements) {
			const flatCompletions = achievements
				.map(achievement => achievement.completionSteps)
				.reduce((a, b) => a.concat(b), []);
			this.total = flatCompletions.length;
			this.achieved = flatCompletions.map(step => step.numberOfCompletions).filter(a => a > 0).length;
		}
	}
}
