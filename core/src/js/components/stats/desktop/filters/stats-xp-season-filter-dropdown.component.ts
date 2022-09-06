import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { StatsXpGraphSeasonFilterType } from '../../../../models/mainwindow/stats/stats-xp-graph-season-filter.type';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { StatsXpGraphFilterSelectedEvent } from '../../../../services/mainwindow/store/events/stats/stats-xp-graph-filter-selected-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'stats-xp-season-filter-dropdown',
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
export class StatsXpSeasonFilterDropdownComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	filter$: Observable<{ filter: string; placeholder: string; options: readonly IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.filter$ = this.store
			.listen$(([main, nav]) => main.stats.filters.xpGraphSeasonFilter)
			.pipe(
				filter(([filter]) => !!filter),
				map(([filter]) => {
					const options = [
						{
							value: 'all-seasons',
							label: 'All seasons',
						},
						{
							value: 'season-1',
							label: 'Season 1',
							tooltip: 'Until 2021-03-30 ',
						},
						{
							value: 'season-2',
							label: 'Season 2',
							tooltip: 'From 2021-04-01 to 2021-08-03',
						},
						{
							value: 'season-3',
							label: 'Season 3',
							tooltip: 'From 2021-08-04',
						},
						{
							value: 'season-4',
							label: 'Season 4',
							tooltip: 'From 2021-12-02',
						},
						{
							value: 'season-5',
							label: 'Season 5',
							tooltip: 'From 2022-04-05',
						},
						{
							value: 'season-6',
							label: 'Season 6',
							tooltip: 'From 2022-08-02',
						},
					] as readonly FilterOption[];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: true,
					};
				}),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
				takeUntil(this.destroyed$),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: FilterOption) {
		this.stateUpdater.next(new StatsXpGraphFilterSelectedEvent(option.value));
	}
}

interface FilterOption extends IOption {
	value: StatsXpGraphSeasonFilterType;
	tooltip?: string;
}
