import { AfterContentInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { BgsActiveTimeFilterType } from '@firestone/battlegrounds/data-access';
import { TimeFilterOption } from '@firestone/battlegrounds/view';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { changeMetaHeroStatsTimeFilter } from './+state/meta-hero-stats/meta-hero-stats.actions';
import { getCurrentTimerFilter } from './+state/meta-hero-stats/meta-hero-stats.selectors';

@Component({
	selector: 'website-battlegrounds-time-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-time-filter-dropdown-view
			class="battlegrounds-rank-filter-dropdown"
			[timePeriods]="timePeriods"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			(valueSelected)="onSelected($event)"
		></battlegrounds-time-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteBattlegroundsTimeFilterDropdownComponent implements AfterContentInit {
	timePeriods: readonly BgsActiveTimeFilterType[];
	currentFilter$: Observable<BgsActiveTimeFilterType>;

	constructor(private readonly store: Store) {}

	ngAfterContentInit() {
		this.timePeriods = ['all-time', 'past-seven', 'past-three', 'last-patch'];
		this.currentFilter$ = this.store.select(getCurrentTimerFilter);
	}

	onSelected(option: TimeFilterOption) {
		console.debug('selected option', option);
		this.store.dispatch(
			changeMetaHeroStatsTimeFilter({
				currentTimePeriodSelection: option.value,
			}),
		);
	}
}
