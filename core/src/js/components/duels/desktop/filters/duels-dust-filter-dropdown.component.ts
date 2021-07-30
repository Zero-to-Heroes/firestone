import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DuelsTopDecksDustFilterType } from '../../../../models/duels/duels-top-decks-dust-filter.type';
import { AppUiStoreService } from '../../../../services/app-ui-store.service';
import { DuelsTopDecksDustFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-top-decks-dust-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'duels-dust-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-dust-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDustFilterDropdownComponent implements AfterViewInit {
	options: readonly DustFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.options = [
			{
				value: 'all',
				label: 'All decks',
			} as DustFilterOption,
			{
				value: '0',
				label: 'Own all cards',
			} as DustFilterOption,
			{
				value: '1000',
				label: '1000 dust',
			} as DustFilterOption,
		] as readonly DustFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.duels.activeTopDecksDustFilter,
				([main, nav]) => nav.navigationDuels.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: ['duels-top-decks'].includes(selectedCategoryId),
				})),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: DustFilterOption) {
		this.stateUpdater.next(new DuelsTopDecksDustFilterSelectedEvent(option.value));
	}
}

interface DustFilterOption extends IOption {
	value: DuelsTopDecksDustFilterType;
}
