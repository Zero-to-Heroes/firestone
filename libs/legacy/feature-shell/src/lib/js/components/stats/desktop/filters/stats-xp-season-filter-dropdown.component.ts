import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
} from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { allSeasons } from '@legacy-import/src/lib/js/services/stats/xp/xp-tables/xp-computation';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { StatsXpGraphSeasonFilterType } from '../../../../models/mainwindow/stats/stats-xp-graph-season-filter.type';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { StatsXpGraphFilterSelectedEvent } from '../../../../services/mainwindow/store/events/stats/stats-xp-graph-filter-selected-event';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'stats-xp-season-filter-dropdown',
	styleUrls: [],
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
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, AfterViewInit
{
	filter$: Observable<{ filter: string; placeholder: string; options: FilterOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.filter$ = this.store
			.listen$(([main, nav]) => main.stats.filters.xpGraphSeasonFilter)
			.pipe(
				filter(([filter]) => !!filter),
				this.mapData(([filter]) => {
					const options = [
						{
							value: 'all-seasons',
							label: 'All seasons',
						},
						...allSeasons.map((season) => ({
							value: season.id,
							label: this.i18n.translateString('app.profile.xp-seasons.season', {
								seasonNumber: season.id.split('-')[1],
							}),
							tooltip: this.i18n.translateString('app.profile.xp-seasons.start-date', {
								startDate: season.startDate.toLocaleDateString(this.i18n.formatCurrentLocale()),
							}),
						})),
					] as FilterOption[];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible: true,
					};
				}),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: FilterOption | IOption) {
		this.stateUpdater.next(new StatsXpGraphFilterSelectedEvent((option as FilterOption).value));
	}
}

interface FilterOption extends IOption {
	value: StatsXpGraphSeasonFilterType;
	tooltip?: string;
}
