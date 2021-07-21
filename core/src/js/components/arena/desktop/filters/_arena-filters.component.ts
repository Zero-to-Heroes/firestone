import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'arena-filters',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/arena/desktop/filters/arena-filters.component.scss`,
	],
	template: `
		<div class="filters arena-filters">
			<arena-time-filter-dropdown class="filter time-filter"></arena-time-filter-dropdown>
			<arena-class-filter-dropdown class="filter class-filter"></arena-class-filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaFiltersComponent {}
