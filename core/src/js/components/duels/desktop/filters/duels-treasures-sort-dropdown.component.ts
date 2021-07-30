import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DuelsTreasureSortFilterType } from '../../../../models/duels/duels-treasure-sort-filter.type';
import { AppUiStoreService } from '../../../../services/app-ui-store.service';
import { DuelsTreasureSortFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-treasure-sort-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'duels-treasures-sort-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-treasures-sort-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTreasuresSortDropdownComponent implements AfterViewInit {
	options: readonly TreasureSortFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.options = [
			{
				value: 'global-winrate',
				label: 'Global winrate',
			} as TreasureSortFilterOption,
			{
				value: 'global-pickrate',
				label: 'Global pick rate',
			} as TreasureSortFilterOption,
			{
				value: 'global-offering',
				label: 'Global offering',
			} as TreasureSortFilterOption,
			{
				value: 'player-pickrate',
				label: 'Your pick rate',
			} as TreasureSortFilterOption,
		] as readonly TreasureSortFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.duels.activeTreasureSortFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: ['duels-treasures'].includes(selectedCategoryId),
				})),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: TreasureSortFilterOption) {
		this.stateUpdater.next(new DuelsTreasureSortFilterSelectedEvent(option.value));
	}
}

interface TreasureSortFilterOption extends IOption {
	value: DuelsTreasureSortFilterType;
}
