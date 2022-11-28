import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'stats-filters',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/stats/desktop/filters/_stats-filters.component.scss`,
	],
	template: `
		<div class="filters stats-filters">
			<stats-xp-season-filter-dropdown class="filter time-filter"></stats-xp-season-filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsFiltersComponent {}
