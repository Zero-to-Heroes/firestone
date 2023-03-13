import { AfterContentInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { initBgsMetaHeroStats } from './+state/meta-hero-stats/meta-hero-stats.actions';
import { MetaHeroStatsState } from './+state/meta-hero-stats/meta-hero-stats.models';
import { getAllMetaHeroStats } from './+state/meta-hero-stats/meta-hero-stats.selectors';

@Component({
	selector: 'website-battlegrounds',
	styleUrls: [`./website-battlegrounds.component.scss`],
	template: `
		<section class="section">
			<!-- (Work in progress) Time: last patch, Rank: all, Tribes: all
			<div class="filters">
				<website-battlegrounds-rank-filter-dropdown></website-battlegrounds-rank-filter-dropdown>
			</div> -->

			<battlegrounds-meta-stats-heroes-view
				*ngIf="stats$ | async as stats"
				[stats]="stats"
				[heroSort]="'tier'"
			></battlegrounds-meta-stats-heroes-view>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteBattlegroundsComponent implements AfterContentInit {
	stats$: Observable<readonly BgsMetaHeroStatTierItem[]>;

	constructor(private readonly store: Store<MetaHeroStatsState>) {}

	ngAfterContentInit(): void {
		this.stats$ = this.store.select(getAllMetaHeroStats);
		console.debug('dispatching creation');
		const action = initBgsMetaHeroStats();
		console.debug('after action creation', action);
		this.store.dispatch(action);
	}
}
