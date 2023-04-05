import { AfterContentInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { DuelsHeroSortFilterType, DuelsMetaStats } from '@firestone/duels/view';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { initDuelsMetaHeroStats } from './+state/website/duels.actions';
import { WebsiteDuelsState } from './+state/website/duels.models';
import { getAllMetaHeroStats } from './+state/website/duels.selectors';

@Component({
	selector: 'website-duels',
	styleUrls: [`./website-duels.component.scss`],
	template: `
		<section class="section">
			<duels-meta-stats-view
				[stats]="stats$ | async"
				[sort]="sort$ | async"
				[hideLowData]="hideLowData$ | async"
			></duels-meta-stats-view>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteDuelsComponent implements AfterContentInit {
	stats$: Observable<readonly DuelsMetaStats[]>;
	sort$: Observable<DuelsHeroSortFilterType>;
	hideLowData$: Observable<boolean>;

	constructor(private readonly store: Store<WebsiteDuelsState>) {}

	ngAfterContentInit(): void {
		this.stats$ = this.store.select(getAllMetaHeroStats);
		// console.debug('dispatching creation');
		const action = initDuelsMetaHeroStats();
		// console.debug('after action creation', action);
		this.store.dispatch(action);
		return;
	}
}
