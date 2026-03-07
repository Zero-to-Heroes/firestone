import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import {
	MainWindowNavigationService,
	MainWindowStateFacadeService,
	StatsXpGraphSeasonFilterType,
} from '@firestone/mainwindow/common';
import { IOption } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { allSeasons } from '@legacy-import/src/lib/js/services/stats/xp/xp-tables/xp-computation';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { StatsXpGraphFilterSelectedEvent } from '@firestone/mainwindow/common';

@Component({
	standalone: false,
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
export class StatsXpSeasonFilterDropdownComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	filter$: Observable<{ filter: string; placeholder: string; options: FilterOption[]; visible: boolean }>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly mainWindowStateFacade: MainWindowStateFacadeService,
		private readonly navigationService: MainWindowNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.navigationService, this.mainWindowStateFacade);

		this.filter$ = combineLatest([
			this.mainWindowStateFacade.mainWindowState$$.pipe(
				this.mapData((state) => state.stats.filters.xpGraphSeasonFilter),
			),
			this.navigationService.navigationState$$.pipe(
				this.mapData((state) => state.navigationStats.selectedCategoryId),
			),
		]).pipe(
			filter(([filter, selectedCategoryId]) => !!filter),
			this.mapData(([filter, selectedCategoryId]) => {
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
					visible: ['xp-graph'].includes(selectedCategoryId),
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	onSelected(option: FilterOption | IOption) {
		this.mainWindowStateFacade.send(new StatsXpGraphFilterSelectedEvent((option as FilterOption).value));
	}
}

interface FilterOption extends IOption {
	value: StatsXpGraphSeasonFilterType;
	tooltip?: string;
}
