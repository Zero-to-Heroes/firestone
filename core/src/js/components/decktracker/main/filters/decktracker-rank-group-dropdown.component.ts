import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { MainWindowStoreEvent } from '@services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '@services/overwolf.service';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { MmrGroupFilterType } from '../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { ChangeDeckRankGroupEvent } from '../../../../services/mainwindow/store/events/decktracker/change-deck-rank-group-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'decktracker-rank-group-dropdown',
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
export class DecktrackerRankGroupDropdownComponent implements AfterViewInit {
	filter$: Observable<{ filter: string; placeholder: string; options: readonly IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreFacadeService) {
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.decktracker.filters?.rankingGroup,
				([main, nav]) => nav.navigationDecktracker.currentView,
			)
			.pipe(
				filter(([filter, currentView]) => !!filter && !!currentView),
				map(([filter, currentView]) => {
					const options = [
						{
							value: 'per-match',
							label: 'Show each match',
						} as RankingGroupOption,
						{
							value: 'per-day',
							label: 'Group per day',
							tooltip: 'Show the rating at the start of each day',
						} as RankingGroupOption,
					] as readonly RankingGroupOption[];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: currentView === 'ladder-ranking',
					};
				}),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: RankingGroupOption) {
		this.stateUpdater.next(new ChangeDeckRankGroupEvent(option.value));
	}
}

interface RankingGroupOption extends IOption {
	value: MmrGroupFilterType;
}
