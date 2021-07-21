import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ArenaClassFilterType } from '../../../../models/arena/arena-class-filter.type';
import { AppUiStoreService } from '../../../../services/app-ui-store.service';
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
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="value.options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassFilterDropdownComponent implements AfterViewInit {
	filter$: Observable<{ filter: string; placeholder: string; options: readonly IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.filter$ = this.store
			.listen$(([main, nav]) => main.arena.activeHeroFilter)
			.pipe(
				filter(([filter]) => !!filter),
				map(([filter]) => {
					const options = ['all', ...(classes as ArenaClassFilterType[])].map(
						(option) =>
							({
								value: option,
								label: option === 'all' ? 'All classes' : formatClass(option),
							} as ClassFilterOption),
					);
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label ?? 'All classes',
						visible: true,
					};
				}),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: ClassFilterOption) {
		this.stateUpdater.next(new ArenaClassFilterSelectedEvent(option.value));
	}
}

interface ClassFilterOption extends IOption {
	value: ArenaClassFilterType;
}
