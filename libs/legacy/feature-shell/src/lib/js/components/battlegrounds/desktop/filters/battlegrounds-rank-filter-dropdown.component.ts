import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { RankFilterOption } from '@firestone/battlegrounds/view';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { Observable } from 'rxjs';
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
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.mmrPercentiles$ = this.store
			.listen$(([main, nav, prefs]) => main.battlegrounds.getMetaHeroStats()?.mmrPercentiles)
			.pipe(
				filter(([percentiles]) => !!percentiles?.length),
				this.mapData(([percentiles]) => percentiles),
			);
		this.currentFilter$ = this.listenForBasicPref$((prefs) => prefs.bgsActiveRankFilter);
		this.visible$ = this.store
			.listen$(
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			)
			.pipe(
				filter(([categoryId, currentView]) => !!categoryId && !!currentView),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				this.mapData(
					([categoryId, currentView]) =>
						!['categories', 'category'].includes(currentView) &&
						![
							'bgs-category-personal-stats',
							'bgs-category-simulator',
							'bgs-category-personal-rating',
						].includes(categoryId),
				),
			);
	}

	async onSelected(option: RankFilterOption) {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			bgsActiveUseMmrFilterInHeroSelection: true,
			bgsActiveRankFilter: +option.value as BgsRankFilterType,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
