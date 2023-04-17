import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { DuelsHeroSortFilterType, DuelsMetaStats } from '@firestone/duels/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { initDuelsMetaHeroPowerStats } from './+state/website/duels.actions';
import { WebsiteDuelsState } from './+state/website/duels.models';
import { getAllMetaHeroPowerStats, getLoaded } from './+state/website/duels.selectors';

@Component({
	selector: 'website-duels-hero-powers',
	styleUrls: ['./meta-info.scss', `./website-duels-heroes.component.scss`],
	template: `
		<with-loading [isLoading]="isLoading$ | async">
			<section class="section">
				<div class="filters">
					<website-duels-rank-filter-dropdown class="filter"></website-duels-rank-filter-dropdown>
					<website-duels-time-filter-dropdown class="filter"></website-duels-time-filter-dropdown>
					<website-duels-hero-filter-dropdown class="filter"></website-duels-hero-filter-dropdown>
					<website-duels-signature-filter-dropdown class="filter"></website-duels-signature-filter-dropdown>
				</div>

				<duels-meta-stats-view
					[stats]="stats$ | async"
					[sort]="sort$ | async"
					[hideLowData]="hideLowData$ | async"
				></duels-meta-stats-view>
			</section>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteDuelsHeroPowersComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	isLoading$: Observable<boolean>;
	stats$: Observable<readonly DuelsMetaStats[]>;
	sort$: Observable<DuelsHeroSortFilterType>;
	hideLowData$: Observable<boolean>;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly store: Store<WebsiteDuelsState>) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.isLoading$ = this.store.select(getLoaded).pipe(this.mapData((loaded) => !loaded));
		this.stats$ = this.store.select(getAllMetaHeroPowerStats);
		// console.debug('dispatching creation');
		const action = initDuelsMetaHeroPowerStats();
		// console.debug('after action creation', action);
		this.store.dispatch(action);
		return;
	}
}
