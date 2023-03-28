import { AfterContentInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { RankFilterOption } from '@firestone/battlegrounds/view';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { changeMetaHeroStatsPercentileFilter } from './+state/meta-hero-stats/meta-hero-stats.actions';
import { getCurrentPercentileFilter, getMmrPercentiles } from './+state/meta-hero-stats/meta-hero-stats.selectors';

@Component({
	selector: 'website-battlegrounds-rank-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-rank-filter-dropdown-view
			class="battlegrounds-rank-filter-dropdown"
			[mmrPercentiles]="mmrPercentiles$ | async"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			(valueSelected)="onSelected($event)"
		></battlegrounds-rank-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteBattlegroundsRankFilterDropdownComponent implements AfterContentInit {
	mmrPercentiles$: Observable<readonly MmrPercentile[]>;
	currentFilter$: Observable<number>;

	constructor(private readonly store: Store) {}

	ngAfterContentInit() {
		this.mmrPercentiles$ = this.store.select(getMmrPercentiles);
		this.currentFilter$ = this.store.select(getCurrentPercentileFilter);
	}

	onSelected(option: RankFilterOption) {
		console.debug('selected option', option);
		this.store.dispatch(
			changeMetaHeroStatsPercentileFilter({
				currentPercentileSelection: +option.value as MmrPercentile['percentile'],
			}),
		);
	}
}
