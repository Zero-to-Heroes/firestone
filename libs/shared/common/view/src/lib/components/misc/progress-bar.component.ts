import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
	selector: 'progress-bar',
	styleUrls: [`./progress-bar.component.scss`],
	template: `
		<div class="progress-bar">
			<span class="current" *ngIf="total > 0 && (!fullTotalLabel || current !== total)"
				>{{ current }}/{{ total }}</span
			>
			<span
				class="current"
				*ngIf="fullTotalLabel && (current === total || total === 0)"
				[helpTooltip]="fullTotalTooltip"
				>{{ fullTotalLabel }}</span
			>
			<span class="current" *ngIf="total === 0 && !fullTotalLabel">Coming soon!</span>
			<div class="progress-bar-content">
				<div class="progress" [style.width.%]="(100.0 * current) / total"></div>
			</div>
		</div>
	`,
	// TODO: remove this
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
	@Input() current: number;
	@Input() total: number;
	@Input() fullTotalLabel: string;
	@Input() fullTotalTooltip: string;
}
