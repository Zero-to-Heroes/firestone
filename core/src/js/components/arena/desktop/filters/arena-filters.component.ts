import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';

@Component({
	selector: 'arena-filters',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/arena/desktop/filters/arena-filters.component.scss`,
	],
	template: `
		<div class="filters arena-filters">
			<arena-time-filter-dropdown
				class="filter time-filter"
				[state]="_state"
				[navigation]="_navigation"
			></arena-time-filter-dropdown>
			<arena-class-filter-dropdown
				class="filter class-filter"
				[state]="_state"
				[navigation]="_navigation"
			></arena-class-filter-dropdown>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaFiltersComponent {
	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}

		this._state = value;
	}

	@Input() set navigation(value: NavigationState) {
		if (value === this._navigation) {
			return;
		}

		this._navigation = value;
	}

	_state: MainWindowState;
	_navigation: NavigationState;
}
