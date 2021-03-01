import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
	selector: 'progress-bar',
	styleUrls: [`../../css/component/progress-bar.component.scss`],
	template: `
		<div class="progress-bar">
			<span class="current" *ngIf="total > 0">{{ current }}/{{ total }}</span>
			<span class="current" *ngIf="total == 0">Coming soon!</span>
			<div class="progress-bar-content">
				<div class="progress" [style.width.%]="(100.0 * current) / total"></div>
			</div>
		</div>
	`,
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
	@Input() current: number;
	@Input() total: number;
}
