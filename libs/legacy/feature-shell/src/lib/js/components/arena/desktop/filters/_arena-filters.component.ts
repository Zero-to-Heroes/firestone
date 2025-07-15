import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaNavigationService } from '@firestone/arena/common';
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
			<arena-mode-filter-dropdown
				class="filter time-filter"
				*ngIf="showModeFilter$ | async"
			></arena-mode-filter-dropdown>
			<arena-time-filter-dropdown
				class="filter time-filter"
				*ngIf="showTimeFilter$ | async"
			></arena-time-filter-dropdown>
			<arena-class-filter-dropdown
				class="filter class-filter"
				*ngIf="showClassFilter$ | async"
			></arena-class-filter-dropdown>
			<arena-card-class-filter-dropdown
				class="filter card-class-filter"
				*ngIf="showCardClassFilter$ | async"
			></arena-card-class-filter-dropdown>
			<arena-card-type-filter-dropdown
				class="filter card-type-filter"
				*ngIf="showCardTypeFilter$ | async"
			></arena-card-type-filter-dropdown>
			<arena-high-win-runs-wins-filter-dropdown
				class="filter card-type-filter"
			></arena-high-win-runs-wins-filter-dropdown>
			<arena-high-wins-card-search
				class="filter high-wins-card-search"
				*ngIf="showArenaHighWinsCardSearch$ | async"
			></arena-high-wins-card-search>
			<preference-toggle
				class="filter show-advanced-card-stats"
				*ngIf="showAdvancedCardStats$ | async"
				field="arenaShowAdvancedCardStats"
				[label]="'app.arena.filters.show-advanced-card-stats' | owTranslate"
			></preference-toggle>
			<replays-icon-toggle class="class-icons" *ngIf="showClassIconToggle$"></replays-icon-toggle>
			<arena-card-search class="filter card-search" *ngIf="showArenaCardSearch$ | async"></arena-card-search>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaFiltersComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	showRegionFilter$: Observable<boolean>;
	showModeFilter$: Observable<boolean>;
	showTimeFilter$: Observable<boolean>;
	showArenaCardSearch$: Observable<boolean>;
	showArenaHighWinsCardSearch$: Observable<boolean>;
	showAdvancedCardStats$: Observable<boolean>;
	showClassIconToggle$: Observable<boolean>;
	showClassFilter$: Observable<boolean>;
	showCardClassFilter$: Observable<boolean>;
	showCardTypeFilter$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: ArenaNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.nav.isReady();

		this.showRegionFilter$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => ['arena-runs', 'arena-stats'].includes(currentView)),
		);
		this.showModeFilter$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) =>
				['arena-runs', 'class-tier-list', 'card-stats', 'arena-stats'].includes(currentView),
			),
		);
		this.showTimeFilter$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) =>
				['arena-runs', 'class-tier-list', 'card-stats', 'arena-stats'].includes(currentView),
			),
		);
		this.showArenaCardSearch$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => ['card-stats'].includes(currentView)),
		);
		this.showAdvancedCardStats$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => ['card-stats'].includes(currentView)),
		);
		this.showArenaHighWinsCardSearch$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => ['arena-high-wins-runs'].includes(currentView)),
		);
		this.showClassIconToggle$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => !['arena-high-wins-runs'].includes(currentView)),
		);
		this.showClassFilter$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => ['arena-runs', 'card-stats', 'arena-high-wins-runs'].includes(currentView)),
		);
		this.showCardClassFilter$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => ['card-stats'].includes(currentView)),
		);
		this.showCardTypeFilter$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => ['card-stats'].includes(currentView)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
