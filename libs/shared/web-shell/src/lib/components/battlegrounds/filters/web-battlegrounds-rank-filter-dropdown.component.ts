import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { BgsMetaHeroStatsService } from '@firestone/battlegrounds/common';
import { BattlegroundsViewModule, RankFilterOption } from '@firestone/battlegrounds/view';
import { BgsRankFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { BaseFilterWithUrlComponent, FilterUrlConfig } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { filter, Observable } from 'rxjs';

@Component({
	standalone: true,
	selector: 'web-battlegrounds-rank-filter-dropdown',
	styleUrls: [],
	template: `
		<battlegrounds-rank-filter-dropdown-view
			class="battlegrounds-rank-filter-dropdown"
			[mmrPercentiles]="mmrPercentiles$ | async"
			[currentFilter]="currentFilter$ | async"
			[visible]="true"
			(valueSelected)="onSelected($event)"
		></battlegrounds-rank-filter-dropdown-view>
	`,
	imports: [CommonModule, BattlegroundsViewModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebBattlegroundsRankFilterDropdownComponent
	extends BaseFilterWithUrlComponent<BgsRankFilterType, Preferences>
	implements AfterContentInit
{
	mmrPercentiles$: Observable<readonly MmrPercentile[]>;
	currentFilter$: Observable<number>;

	protected filterConfig: FilterUrlConfig<BgsRankFilterType, Preferences> = {
		paramName: 'bgsActiveRankFilter',
		preferencePath: 'bgsActiveRankFilter',
		// Note: validValues not specified since rank values are dynamic based on MMR percentiles
	};

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		protected override readonly route: ActivatedRoute,
		protected override readonly router: Router,
		protected override readonly prefs: PreferencesService,
		private readonly metaHeroStats: BgsMetaHeroStatsService,
	) {
		super(cdr, prefs, route, router, new Preferences());
	}

	async ngAfterContentInit() {
		await waitForReady(this.metaHeroStats, this.prefs);

		// Initialize URL synchronization
		this.initializeUrlSync();

		this.mmrPercentiles$ = this.metaHeroStats.metaHeroStats$$.pipe(
			this.mapData((stats) => stats?.mmrPercentiles),
			filter((percentiles) => !!percentiles?.length),
			this.mapData((percentiles) => percentiles),
		);
		this.currentFilter$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveRankFilter));

		this.cdr.detectChanges();
	}

	onSelected(option: RankFilterOption) {
		this.prefs.updatePrefs('bgsActiveRankFilter', +option.value as BgsRankFilterType);
	}
}
