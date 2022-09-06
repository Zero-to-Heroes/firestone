import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

/** @deprecated Use generic progress-bar component instead */
@Component({
	selector: 'achievement-progress-bar',
	styleUrls: [`../../../css/component/achievements/achievement-progress-bar.component.scss`],
	template: `
		<div class="achievement-progress-bar" *ngIf="total > 0">
			<span class="achieved">{{ achieved }}/{{ total }}</span>
			<div class="progress-bar">
				<div class="progress" [style.width.%]="(100.0 * achieved) / total"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementProgressBarComponent {
	@Input() achieved: number;
	@Input() total: number;
}
