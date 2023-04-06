import { AfterContentInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { DuelsTimeFilterType } from '@firestone/duels/data-access';
import { TimeFilterOption, TimePeriod } from '@firestone/duels/view';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { changeMetaHeroStatsTimeFilter } from '../+state/website/duels.actions';
import { WebsiteDuelsState } from '../+state/website/duels.models';
import { getCurrentTimerFilter } from '../+state/website/duels.selectors';

@Component({
	selector: 'website-duels-time-filter-dropdown',
	styleUrls: [],
	template: `
		<duels-time-filter-dropdown-view
			class="duels-time-filter-dropdown"
			[timePeriods]="timePeriods$ | async"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			(valueSelected)="onSelected($event)"
		></duels-time-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteDuelsTimeFilterDropdownComponent implements AfterContentInit {
	timePeriods$: Observable<readonly TimePeriod[]>;
	currentFilter$: Observable<DuelsTimeFilterType>;

	constructor(private readonly store: Store<WebsiteDuelsState>) {}

	ngAfterContentInit() {
		this.timePeriods$ = of([
			{ value: 'all-time' },
			{ value: 'past-seven' },
			{ value: 'past-three' },
			{ value: 'last-patch' },
		]);
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
