import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'mercenaries-filters',
	styleUrls: [
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/mercenaries/desktop/filters/_mercenaries-filters.component.scss`,
	],
	template: `
		<div class="mercenaries-filters">
			<mercenaries-mode-filter-dropdown class="mode"></mercenaries-mode-filter-dropdown>
			<mercenaries-pve-difficulty-filter-dropdown
				class="pve-difficulty"
			></mercenaries-pve-difficulty-filter-dropdown>
			<mercenaries-pvp-mmr-filter-dropdown class="pvp-mmr"></mercenaries-pvp-mmr-filter-dropdown>
			<mercenaries-role-filter-dropdown class="role"></mercenaries-role-filter-dropdown>
			<mercenaries-hero-level-filter-dropdown class="level"></mercenaries-hero-level-filter-dropdown>
			<mercenaries-starter-filter-dropdown class="starter"></mercenaries-starter-filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesFiltersComponent {}
