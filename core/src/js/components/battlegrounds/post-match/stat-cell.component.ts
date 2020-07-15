import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

declare let amplitude: any;

@Component({
	selector: 'stat-cell',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/stat-cell.component.scss`,
		`../../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="entry cell" [ngClass]="{ 'new-record': isNewRecord }">
			<div class="record-icon" helpTooltip="You broke your personal record!">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#new_record" />
				</svg>
			</div>
			<div class="label" [helpTooltip]="tooltipText">{{ label }}</div>
			<div class="value">{{ value }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCellComponent {
	@Input() label: string;
	@Input() value: number;
	@Input() isNewRecord: boolean;
	@Input() tooltipText: string;
}
