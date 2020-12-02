import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { DuelsDropdownOption } from './duels-dropdown-option';
import { DuelsGameModeSortFilterOption } from './duels-game-mode-sort-filter-option';
import { DuelsHeroFilterOption } from './duels-hero-filter-option';
import { DuelsStatTypeOption } from './duels-stat-type-option';
import { DuelsTimeSortFilterOption } from './duels-time-sort-filter-option';
import { DuelsClassFilterOption } from './duels-top-decks-class-filter-option';
import { DuelsTopDecksDustFilterOption } from './duels-top-decks-dust-filter-option';
import { DuelsTreasurePassiveTypeOption } from './duels-treasure-passive-type-option';
import { DuelsTreasureSortOption } from './duels-treasure-sort-option';

@Component({
	selector: 'duels-filters',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/duels/desktop/filters/duels-filters.component.scss`,
	],
	template: `
		<div class="filters duels-filters" *ngIf="anyVisible()">
			<duels-filter-dropdown
				*ngFor="let option of options"
				class="{{ option.class }}"
				[option]="option.option"
				[state]="_state"
				[navigation]="_navigation"
			></duels-filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsFiltersComponent {
	@Input() set state(value: MainWindowState) {
		this._state = value;
		this.doSetValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.doSetValues();
	}

	_state: MainWindowState;
	_navigation: NavigationState;

	options: readonly InternalOption[];

	anyVisible() {
		return this.options.some(option => option.option.visibleHandler(this._navigation, this._state));
	}

	private doSetValues() {
		if (!this._state || !this._navigation) {
			return;
		}
		this.options = [
			{ class: 'game-mode-sort-filter', option: new DuelsGameModeSortFilterOption() } as InternalOption,
			{ class: 'treasure-sort-filter', option: new DuelsTreasureSortOption() } as InternalOption,
			{ class: 'stat-type-filter', option: new DuelsStatTypeOption() } as InternalOption,
			{ class: 'treasure-passive-type-filter', option: new DuelsTreasurePassiveTypeOption() } as InternalOption,
			{ class: 'hero-sort-filter', option: new DuelsHeroFilterOption() } as InternalOption,
			{ class: 'time-sort-filter', option: new DuelsTimeSortFilterOption() } as InternalOption,
			{ class: 'class-filter', option: new DuelsClassFilterOption() } as InternalOption,
			{ class: 'top-decks-dust-filter', option: new DuelsTopDecksDustFilterOption() } as InternalOption,
		];
	}
}

interface InternalOption {
	class: string;
	option: DuelsDropdownOption;
}
