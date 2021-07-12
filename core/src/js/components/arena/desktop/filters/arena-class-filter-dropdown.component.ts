import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { IOption } from 'ng-select';
import { ArenaClassFilterType } from '../../../../models/arena/arena-class-filter.type';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { classes, formatClass } from '../../../../services/hs-utils';
import { ArenaClassFilterSelectedEvent } from '../../../../services/mainwindow/store/events/arena/arena-class-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

/** This approach seems to be the cleanest way to properly narrow down the values needed from
 * the state. The other approaches are cool and data-driven, but as of now they seem more
 * difficult to implement with a store approach. The other filters might have to be refactored
 * to this approach
 */
@Component({
	selector: 'arena-class-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/arena/desktop/filters/arena-filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			class="arena-class-filter-dropdown"
			[options]="options"
			[filter]="filter"
			[placeholder]="placeholder"
			[visible]="true"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassFilterDropdownComponent implements AfterViewInit {
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

	onSelected(option: ClassFilterOption) {
		this.stateUpdater.next(new ArenaClassFilterSelectedEvent(option.value));
	}

	private updateInfo(state: MainWindowState, navigation: NavigationState) {
		if (!state) {
			return;
		}

		this.options =
			this.options ??
			['all', ...(classes as ArenaClassFilterType[])].map(
				(option) =>
					({
						value: option,
						label: option === 'all' ? 'All classes' : formatClass(option),
					} as ClassFilterOption),
			);
		this.filter = state.arena.activeHeroFilter;
		this.placeholder = this.options.find((option) => option.value === this.filter)?.label ?? 'All classes';
	}
}

interface ClassFilterOption extends IOption {
	value: ArenaClassFilterType;
}
