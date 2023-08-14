import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'sortable-table-label',
	styleUrls: [`./sortable-table-label.component.scss`],
	template: `
		<div
			class="sortable-label"
			[ngClass]="{
				sortable: isSortable,
				'active-asc': sort?.criteria === criteria && sort?.direction === 'asc',
				'active-desc': sort?.criteria === criteria && sort?.direction === 'desc'
			}"
			(click)="startSort()"
		>
			<div class="label">
				<span>{{ name }}</span>
				<!-- TODO: use neutral sortable icon -->
				<div class="caret" inlineSVG="assets/svg/arrow.svg"></div>
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

export interface SortCriteria<T> {
	readonly criteria: T;
	readonly direction: SortDirection;
}

export type SortDirection = 'asc' | 'desc';

export const invertDirection = (direction: SortDirection): SortDirection => {
	switch (direction) {
		case 'asc':
			return 'desc';
		case 'desc':
			return 'asc';
		default:
			return 'desc';
	}
};
