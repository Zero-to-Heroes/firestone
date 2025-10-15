import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SortCriteria } from '@firestone/shared/framework/common';

@Component({
	standalone: false,
	selector: 'sortable-table-label',
	styleUrls: [`./sortable-table-label.component.scss`],
	template: `
		<div
			class="sortable-label"
			[ngClass]="{
				sortable: isSortable,
				'active-asc': sort.criteria === criteria && sort.direction === 'asc',
				'active-desc': sort.criteria === criteria && sort.direction === 'desc',
			}"
			(click)="startSort()"
		>
			<div class="label">
				<span>{{ name }}</span>
				<!-- TODO: use neutral sortable icon -->
				<div class="caret" inlineSVG="assets/svg/arrow_sort.svg"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortableLabelComponent<T> {
	@Output() sortClick = new EventEmitter<T>();

	@Input() name: string;
	@Input() criteria: T;
	@Input() sort: SortCriteria<T>;
	@Input() isSortable = true;

	startSort() {
		if (!this.isSortable) {
			return;
		}
		this.sortClick.next(this.criteria);
	}
}
