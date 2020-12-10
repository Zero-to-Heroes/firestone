import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
	selector: 'achievement-progress-bar',
	styleUrls: [`../../../css/component/achievements/achievement-progress-bar.component.scss`],
	template: `
		<div class="achievement-progress-bar">
			<span class="achieved" *ngIf="total > 0">{{ achieved }}/{{ total }}</span>
			<span class="achieved" *ngIf="total == 0">Coming soon!</span>
			<div class="progress-bar">
				<div class="progress" [style.width.%]="(100.0 * achieved) / total"></div>
			</div>
		</div>
	`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AchievementProgressBarComponent {
	@Input() achieved: number;
	@Input() total: number;
}
