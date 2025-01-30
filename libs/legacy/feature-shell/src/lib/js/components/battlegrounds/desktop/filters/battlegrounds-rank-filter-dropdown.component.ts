import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { BattlegroundsNavigationService, BgsMetaHeroStatsService } from '@firestone/battlegrounds/common';
import { RankFilterOption } from '@firestone/battlegrounds/view';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { BgsRankFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-rank-filter.type';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';

@Component({
	selector: 'battlegrounds-rank-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-rank-filter-dropdown-view
			class="battlegrounds-rank-filter-dropdown"
			[mmrPercentiles]="mmrPercentiles$ | async"
			[currentFilter]="currentFilter$ | async"
			[visible]="visible$ | async"
			(valueSelected)="onSelected($event)"
		></battlegrounds-rank-filter-dropdown-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsRankFilterDropdownComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	mmrPercentiles$: Observable<readonly MmrPercentile[]>;
	currentFilter$: Observable<number>;
	visible$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly metaHeroStats: BgsMetaHeroStatsService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.metaHeroStats, this.prefs, this.nav);

		this.mmrPercentiles$ = this.metaHeroStats.metaHeroStats$$.pipe(
			this.mapData((stats) => stats?.mmrPercentiles),
			filter((percentiles) => !!percentiles?.length),
			this.mapData((percentiles) => percentiles),
		);
		this.currentFilter$ = this.listenForBasicPref$((prefs) => prefs.bgsActiveRankFilter);
		this.visible$ = combineLatest([
			this.nav.selectedCategoryId$$,
			this.store.listen$(([main, nav]) => nav.navigationBattlegrounds.currentView),
		]).pipe(
			filter(([categoryId, [currentView]]) => !!categoryId && !!currentView),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			this.mapData(
				([categoryId, [currentView]]) =>
					!['categories', 'category'].includes(currentView) &&
					[
						// 'bgs-category-your-stats',
						'bgs-category-personal-heroes',
						'bgs-category-meta-heroes',
						'bgs-category-meta-quests',
						'bgs-category-meta-cards',
						'bgs-category-personal-quests',
						'bgs-category-personal-hero-details',
						'bgs-category-perfect-games',
					].includes(categoryId),
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async onSelected(option: RankFilterOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			// bgsActiveUseMmrFilterInHeroSelection: true,
			bgsActiveRankFilter: +option.value as BgsRankFilterType,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
