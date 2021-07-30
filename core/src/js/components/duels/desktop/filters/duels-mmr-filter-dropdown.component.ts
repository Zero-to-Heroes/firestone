import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AppUiStoreService } from '../../../../services/app-ui-store.service';
import { DuelsMmrFilterSelectedEvent } from '../../../../services/mainwindow/store/events/duels/duels-mmr-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'duels-mmr-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="duels-mmr-filter-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsMmrFilterDropdownComponent implements AfterViewInit {
	options: readonly RankFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.options = [
			{
				value: 'all',
				label: 'All ranks',
			} as RankFilterOption,
			{
				value: '4000',
				label: '4,000+',
			} as RankFilterOption,
			{
				value: '6000',
				label: '6,000+',
			} as RankFilterOption,
			{
				value: '8000',
				label: '8,000+',
			} as RankFilterOption,
			{
				value: '10000',
				label: '10,000+',
			} as RankFilterOption,
		] as readonly RankFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.duels.activeMmrFilter,
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

	onSelected(option: RankFilterOption) {
		this.stateUpdater.next(new DuelsMmrFilterSelectedEvent(option.value));
	}
}

interface RankFilterOption extends IOption {
	value: 'all' | string;
}
