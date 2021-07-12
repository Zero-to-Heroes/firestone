import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { IOption } from 'ng-select';
import { ArenaTimeFilterType } from '../../../../models/arena/arena-time-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { ArenaTimeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/arena/arena-time-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { formatPatch } from '../../../../services/utils';

/** This approach seems to be the cleanest way to properly narrow down the values needed from
 * the state. The other approaches are cool and data-driven, but as of now they seem more
 * difficult to implement with a store approach. The other filters might have to be refactored
 * to this approach
 */
@Component({
	selector: 'arena-time-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/arena/desktop/filters/arena-filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			class="arena-time-filter-dropdown"
			[options]="options"
			[filter]="filter"
			[placeholder]="placeholder"
			[visible]="true"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaTimeFilterDropdownComponent implements AfterViewInit {
	@Input() set state(value: MainWindowState) {
		if (value === this._state) {
			return;
		}

		this._state = value;
		this.updateInfo(this._state, this._navigation);
	}

	@Input() set navigation(value: NavigationState) {
		if (value === this._navigation) {
			return;
		}

		this._navigation = value;
		this.updateInfo(this._state, this._navigation);
	}

	options: readonly IOption[];
	filter: string;
	placeholder: string;

	private _state: MainWindowState;
	private _navigation: NavigationState;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: TimeFilterOption) {
		this.stateUpdater.next(new ArenaTimeFilterSelectedEvent(option.value));
	}

	private updateInfo(state: MainWindowState, navigation: NavigationState) {
		if (!state || !navigation) {
			return;
		}

		this.options = [
			{
				value: 'all-time',
				label: 'Past 100 days',
			} as TimeFilterOption,
			{
				value: 'last-patch',
				label: `Last patch`,
				tooltip: formatPatch(state.arena.currentArenaMetaPatch),
			} as TimeFilterOption,
			{
				value: 'past-seven',
				label: 'Past 7 days',
			} as TimeFilterOption,
			{
				value: 'past-three',
				label: 'Past 3 days',
			} as TimeFilterOption,
		] as readonly TimeFilterOption[];
		this.filter = state.arena.activeTimeFilter;
		this.placeholder = this.options.find((option) => option.value === this.filter)?.label ?? 'Past 100 days';
	}
}

interface TimeFilterOption extends IOption {
	value: ArenaTimeFilterType;
}
