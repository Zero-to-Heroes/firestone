import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';

@Component({
	selector: 'website-profile-collection',
	// styleUrls: [``],
	template: `
		Collection is here
		<!-- <with-loading [isLoading]="isLoading$ | async">
			<section class="section">
				<div class="filters">
					<website-duels-rank-filter-dropdown class="filter"></website-duels-rank-filter-dropdown>
					<website-duels-time-filter-dropdown class="filter"></website-duels-time-filter-dropdown>
					<website-duels-hero-filter-dropdown class="filter"></website-duels-hero-filter-dropdown>
				</div>

				<duels-meta-stats-view
					[stats]="stats$ | async"
					[sort]="sort$ | async"
					[hideLowData]="hideLowData$ | async"
				></duels-meta-stats-view>
			</section>
		</with-loading> -->
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteProfileCollectionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	// isLoading$: Observable<boolean>;
	// stats$: Observable<readonly DuelsMetaStats[]>;
	// sort$: Observable<DuelsHeroSortFilterType>;
	// hideLowData$: Observable<boolean>;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly store: Store) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		// this.isLoading$ = this.store.select(getLoaded).pipe(this.mapData((loaded) => !loaded));
		// this.stats$ = this.store.select(getAllMetaHeroStats);
		// // console.debug('dispatching creation');
		// const action = initDuelsMetaHeroStats();
		// // console.debug('after action creation', action);
		// this.store.dispatch(action);
		return;
	}
}
