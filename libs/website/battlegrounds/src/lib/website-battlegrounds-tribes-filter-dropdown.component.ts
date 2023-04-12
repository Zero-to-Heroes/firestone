import { AfterContentInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { changeMetaHeroStatsTribesFilter } from './+state/meta-hero-stats/meta-hero-stats.actions';
import { getAllTribes, getCurrentTribesFilter } from './+state/meta-hero-stats/meta-hero-stats.selectors';

@Component({
	selector: 'website-battlegrounds-tribes-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-tribes-filter-dropdown-view
			class="battlegrounds-rank-filter-dropdown"
			[allTribes]="allTribes$ | async"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			(valueSelected)="onSelected($event)"
		></battlegrounds-tribes-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebsiteBattlegroundsTribesFilterDropdownComponent implements AfterContentInit {
	allTribes$: Observable<readonly Race[]>;
	currentFilter$: Observable<readonly Race[]>;

	constructor(private readonly store: Store) {}

	ngAfterContentInit() {
		this.allTribes$ = this.store.select(getAllTribes);
		this.currentFilter$ = this.store.select(getCurrentTribesFilter);
	}

	onSelected(values: readonly Race[]) {
		console.debug('selected values', values);
		this.store.dispatch(
			changeMetaHeroStatsTribesFilter({
				currentTribesSelection: values,
			}),
		);
	}
}
