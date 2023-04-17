import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { initBgsMetaHeroStats } from './+state/meta-hero-stats/meta-hero-stats.actions';
import { MetaHeroStatsState } from './+state/meta-hero-stats/meta-hero-stats.models';
import { getAllMetaHeroStats, getLoaded } from './+state/meta-hero-stats/meta-hero-stats.selectors';

@Component({
	selector: 'website-battlegrounds',
	styleUrls: [`./website-battlegrounds.component.scss`],
	template: `
		<with-loading [isLoading]="isLoading$ | async">
			<section class="section">
				<div class="filters">
					<website-battlegrounds-rank-filter-dropdown
						class="filter"
					></website-battlegrounds-rank-filter-dropdown>
					<website-battlegrounds-time-filter-dropdown
						class="filter"
					></website-battlegrounds-time-filter-dropdown>
					<website-battlegrounds-tribes-filter-dropdown
						class="filter"
					></website-battlegrounds-tribes-filter-dropdown>
				</div>

				<battlegrounds-meta-stats-heroes-view
					*ngIf="stats$ | async as stats"
					[stats]="stats"
					[heroSort]="'tier'"
				></battlegrounds-meta-stats-heroes-view>
			</section>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteBattlegroundsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	isLoading$: Observable<boolean>;
	stats$: Observable<readonly BgsMetaHeroStatTierItem[]>;

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly store: Store<MetaHeroStatsState>) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.isLoading$ = this.store.select(getLoaded).pipe(this.mapData((loaded) => !loaded));
		this.stats$ = this.store.select(getAllMetaHeroStats);
		console.debug('dispatching creation');
		const action = initBgsMetaHeroStats();
		console.debug('after action creation', action);
		this.store.dispatch(action);
	}
}
