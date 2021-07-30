import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DuelsStatTypeFilterType } from '../../../../models/duels/duels-stat-type-filter.type';
import { AppUiStoreService } from '../../../../services/app-ui-store.service';
import { DuelsStatTypeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-stat-type-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'duels-stat-type-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-stat-type-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsStatTypeFilterDropdownComponent implements AfterViewInit {
	options: readonly StatTypeFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.options = [
			{
				value: 'hero',
				label: 'Heroes',
			} as StatTypeFilterOption,
			{
				value: 'hero-power',
				label: 'Hero Powers',
			} as StatTypeFilterOption,
			{
				value: 'signature-treasure',
				label: 'Signature Treasures',
			} as StatTypeFilterOption,
		] as readonly StatTypeFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.duels.activeStatTypeFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: ['duels-stats'].includes(selectedCategoryId),
				})),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: StatTypeFilterOption) {
		this.stateUpdater.next(new DuelsStatTypeFilterSelectedEvent(option.value));
	}
}

interface StatTypeFilterOption extends IOption {
	value: DuelsStatTypeFilterType;
}
