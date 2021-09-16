import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'battlegrounds-filters',
	styleUrls: [
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/battlegrounds/desktop/filters/_battlegrounds-filters.component.scss`,
	],
	template: `
		<div class="battlegrounds-filters">
			<battlegrounds-hero-sort-dropdown class="hero-sort"></battlegrounds-hero-sort-dropdown>
			<battlegrounds-hero-filter-dropdown class="hero-filter"></battlegrounds-hero-filter-dropdown>
			<battlegrounds-rank-filter-dropdown class="rank-filter"></battlegrounds-rank-filter-dropdown>
			<battlegrounds-tribes-filter-dropdown class="tribes-filter"></battlegrounds-tribes-filter-dropdown>
			<battlegrounds-rank-group-dropdown class="rank-group"></battlegrounds-rank-group-dropdown>
			<battlegrounds-time-filter-dropdown class="time-filter"></battlegrounds-time-filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsFiltersComponent {}
