import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'set-stat-cell',
	styleUrls: [
		`../../../css/global/scrollbar.scss`,
		`../../../css/global/forms.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/collection/set-stat-cell.component.scss`,
	],
	template: `
		<div class="set-stat-cell">
			<div class="text">{{ text }}</div>
			<div class="value" [ngClass]="{ 'completed': current === total }">
				<div class="item" *ngIf="current != null">{{ current.toLocaleString() }}</div>
				<div class="item" *ngIf="total != null">/</div>
				<div class="item" *ngIf="total != null">{{ total.toLocaleString() }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetStatCellComponent {
	@Input() text: string;
	@Input() current: number;
	@Input() total: number;
}
