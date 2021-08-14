import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { DeckTimeFilterType } from '@models/mainwindow/decktracker/deck-time-filter.type';
import { ChangeDeckTimeFilterEvent } from '@services/mainwindow/store/events/decktracker/change-deck-time-filter-event';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '@services/overwolf.service';
import { AppUiStoreService } from '@services/ui-store/app-ui-store.service';
import { formatPatch } from '@services/utils';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
	selector: 'decktracker-time-filter-dropdown',
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
export class DecktrackerTimeFilterDropdownComponent implements AfterViewInit {
	filter$: Observable<{ filter: string; placeholder: string; options: readonly IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.decktracker.filters?.time,
				([main, nav]) => main.decktracker.patch,
				([main, nav]) => nav.navigationDecktracker.currentView,
			)
			.pipe(
				filter(([filter, patch, currentView]) => !!filter && !!patch && !!currentView),
				map(([filter, patch, currentView]) => {
					const options = [
						{
							value: 'all-time',
							label: 'Past 100 days',
						} as TimeFilterOption,
						{
							value: 'season-start',
							label: 'This season',
						} as TimeFilterOption,
						{
							value: 'last-patch',
							label: 'Last patch',
							tooltip: formatPatch(patch),
						} as TimeFilterOption,
						{
							value: 'past-30',
							label: 'Past 30 days',
						} as TimeFilterOption,
						{
							value: 'past-7',
							label: 'Past 7 days',
						} as TimeFilterOption,
						{
							value: 'past-1',
							label: 'Past day',
						} as TimeFilterOption,
					] as readonly TimeFilterOption[];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: true,
					};
				}),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: TimeFilterOption) {
		this.stateUpdater.next(new ChangeDeckTimeFilterEvent(option.value));
	}
}

interface TimeFilterOption extends IOption {
	value: DeckTimeFilterType;
}
