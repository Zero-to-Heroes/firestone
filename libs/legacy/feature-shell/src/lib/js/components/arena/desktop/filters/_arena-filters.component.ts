import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'arena-filters',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/arena/desktop/filters/arena-filters.component.scss`,
	],
	template: `
		<div class="filters arena-filters">
			<region-filter-dropdown class="filter" *ngIf="showRegionFilter$ | async"></region-filter-dropdown>
			<arena-time-filter-dropdown class="filter time-filter"></arena-time-filter-dropdown>
			<arena-class-filter-dropdown class="filter class-filter"></arena-class-filter-dropdown>
			<arena-card-class-filter-dropdown class="filter card-class-filter"></arena-card-class-filter-dropdown>
			<arena-card-type-filter-dropdown class="filter card-type-filter"></arena-card-type-filter-dropdown>
			<!-- Do it here because for now the current view is in the store -->
			<arena-card-search class="filter card-search" *ngIf="showArenaCardSearch$ | async"></arena-card-search>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaFiltersComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	showRegionFilter$: Observable<boolean>;
	showArenaCardSearch$: Observable<boolean>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showRegionFilter$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationArena.selectedCategoryId)
			.pipe(this.mapData(([currentView]) => ['arena-runs'].includes(currentView)));
		this.showArenaCardSearch$ = this.store
			.listen$(([main, nav, prefs]) => nav.navigationArena.selectedCategoryId)
			.pipe(this.mapData(([currentView]) => ['card-stats'].includes(currentView)));
	}
}
