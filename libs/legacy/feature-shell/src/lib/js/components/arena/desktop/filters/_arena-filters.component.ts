import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaClassStats } from '@firestone-hs/arena-stats';
import { ArenaClassStatsService, ArenaNavigationService } from '@firestone/arena/common';
import { isDualClassArena } from '@firestone/game-state';
import {
	FORCE_DISABLE_SHOW_ARENA_CLASS_STATS_MATRIX_TOGGLE,
	FORCE_SHOW_ARENA_CLASS_STATS_MATRIX_TOGGLE,
} from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';

@Component({
	standalone: false,
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
			<arena-card-hero-power-filter-dropdown
				class="filter card-class-filter"
				*ngIf="showCardHeroPowerFilter$ | async"
			></arena-card-hero-power-filter-dropdown>
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
			<replays-icon-toggle class="class-icons" *ngIf="showClassIconToggle$ | async"></replays-icon-toggle>
			<arena-class-stats-matrix-toggle
				class="filter show-class-stats-matrix"
				*ngIf="showClassStatsMatrixToggle$ | async"
			></arena-class-stats-matrix-toggle>
			<arena-card-search class="filter card-search" *ngIf="showArenaCardSearch$ | async"></arena-card-search>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaFiltersComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	showRegionFilter$: Observable<boolean>;
	showModeFilter$: Observable<boolean>;
	showTimeFilter$: Observable<boolean>;
	showArenaCardSearch$: Observable<boolean>;
	showArenaHighWinsCardSearch$: Observable<boolean>;
	showAdvancedCardStats$: Observable<boolean>;
	showClassIconToggle$: Observable<boolean>;
	showClassStatsMatrixToggle$: Observable<boolean>;
	showClassFilter$: Observable<boolean>;
	showCardClassFilter$: Observable<boolean>;
	showCardHeroPowerFilter$: Observable<boolean>;
	showCardTypeFilter$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly nav: ArenaNavigationService,
		private readonly arenaClassStats: ArenaClassStatsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.nav.isReady();
		await waitForReady(this.arenaClassStats);

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
		this.showClassStatsMatrixToggle$ = combineLatest([
			this.nav.selectedCategoryId$$,
			this.arenaClassStats.classStatsRaw$$,
		]).pipe(
			this.mapData(
				([currentView, raw]) =>
					currentView === 'class-tier-list' &&
					!FORCE_DISABLE_SHOW_ARENA_CLASS_STATS_MATRIX_TOGGLE &&
					(FORCE_SHOW_ARENA_CLASS_STATS_MATRIX_TOGGLE || hasMultipleHeroPowersPerClass(raw)),
			),
		);
		this.showClassIconToggle$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => !['class-tier-list'].includes(currentView)),
		);
		this.showClassFilter$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => ['arena-runs', 'card-stats', 'arena-high-wins-runs'].includes(currentView)),
		);
		this.showCardClassFilter$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => ['card-stats'].includes(currentView)),
		);
		this.showCardHeroPowerFilter$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => ['card-stats'].includes(currentView) && isDualClassArena),
		);
		this.showCardTypeFilter$ = this.nav.selectedCategoryId$$.pipe(
			this.mapData((currentView) => ['card-stats'].includes(currentView)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}

const hasMultipleHeroPowersPerClass = (raw: ArenaClassStats | null | undefined): boolean => {
	if (!raw?.stats?.length) {
		return false;
	}
	const heroPowersByClass = new Map<string, Set<string>>();
	for (const stat of raw.stats) {
		const classKey = stat.playerClass?.toUpperCase();
		if (!classKey) {
			continue;
		}
		if (!heroPowersByClass.has(classKey)) {
			heroPowersByClass.set(classKey, new Set());
		}
		heroPowersByClass.get(classKey)!.add(stat.playerHeroPower ?? '');
	}
	for (const heroPowers of heroPowersByClass.values()) {
		if (heroPowers.size > 1) {
			return true;
		}
	}
	return false;
};
