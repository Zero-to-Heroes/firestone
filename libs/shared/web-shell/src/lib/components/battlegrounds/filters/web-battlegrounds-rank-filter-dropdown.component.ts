import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MmrPercentile } from '@firestone-hs/bgs-global-stats';
import { BgsMetaHeroStatsService } from '@firestone/battlegrounds/common';
import { BattlegroundsViewModule, RankFilterOption } from '@firestone/battlegrounds/view';
import { BgsRankFilterType } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { PreferencesService } from 'libs/shared/common/service/src/lib/services/preferences.service';
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
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	mmrPercentiles$: Observable<readonly MmrPercentile[]>;
	currentFilter$: Observable<number>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly metaHeroStats: BgsMetaHeroStatsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.metaHeroStats, this.prefs);

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
