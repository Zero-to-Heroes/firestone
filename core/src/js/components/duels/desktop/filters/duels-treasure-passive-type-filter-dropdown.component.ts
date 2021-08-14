import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { DuelsTreasureStatTypeFilterType } from '../../../../models/duels/duels-treasure-stat-type-filter.type';
import { DuelsTreasurePassiveTypeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-treasure-passive-type-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreService } from '../../../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'duels-treasure-passive-type-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-treasure-passive-type-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTreasurePassiveTypeFilterDropdownComponent implements AfterViewInit {
	options: readonly TreasurePassiveTypeFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
	) {
		this.options = [
			{
				value: 'treasure-1',
				label: 'Treasures Pool 1',
			} as TreasurePassiveTypeFilterOption,
			{
				value: 'treasure-2',
				label: 'Treasures Pool 2',
			} as TreasurePassiveTypeFilterOption,
			{
				value: 'treasure-3',
				label: 'Treasures Pool 2 Ultra Rares only',
			} as TreasurePassiveTypeFilterOption,
			{
				value: 'passive-1',
				label: 'Passives Pool 1',
			} as TreasurePassiveTypeFilterOption,
			{
				value: 'passive-2',
				label: 'Passives Pool 2',
			} as TreasurePassiveTypeFilterOption,
			{
				value: 'passive-3',
				label: 'Passives Pool 2 Ultra Rares only',
			} as TreasurePassiveTypeFilterOption,
		] as readonly TreasurePassiveTypeFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav, prefs]) => prefs.duelsActiveTreasureStatTypeFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: ['duels-treasures'].includes(selectedCategoryId),
				})),
				// Don't know why this is necessary, but without it, the filter doesn't update
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: TreasurePassiveTypeFilterOption) {
		this.stateUpdater.next(new DuelsTreasurePassiveTypeFilterSelectedEvent(option.value));
	}
}

interface TreasurePassiveTypeFilterOption extends IOption {
	value: DuelsTreasureStatTypeFilterType;
}
