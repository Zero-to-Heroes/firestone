import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	standalone: false,
	selector: 'stat-cell-simple',
	styleUrls: [`./stat-cell.component.scss`],
	template: `
		<div class="entry">
			<div class="label">{{ label }}</div>
			<div class="filler"></div>
			<div class="value">{{ formatValue() }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCellComponent {
	@Input() label: string;
	@Input() value: number;
	@Input() decimals: number;

	formatValue() {
		if (this.value == null || isNaN(this.value)) {
			return '-';
		}
		if (!this.decimals) {
			return this.value;
		}
		return this.value?.toFixed(this.decimals);
	}
}
