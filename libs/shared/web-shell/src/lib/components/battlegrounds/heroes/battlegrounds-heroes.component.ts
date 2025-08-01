import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
import { BgsMetaHeroStatsService } from '@firestone/battlegrounds/common';
import { BgsMetaHeroStatsAccessService, BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { BattlegroundsViewModule, BgsHeroSortFilterType } from '@firestone/battlegrounds/view';
import { Config } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable, shareReplay, switchMap, takeUntil, tap } from 'rxjs';
import { WebBattlegroundsFiltersComponent } from '../filters/_web-battlegrounds-filters.component';
import { WebBattlegroundsModeFilterDropdownComponent } from '../filters/web-battlegrounds-mode-filter-dropdown.component';
import { WebBattlegroundsRankFilterDropdownComponent } from '../filters/web-battlegrounds-rank-filter-dropdown.component';
import { WebBattlegroundsTimeFilterDropdownComponent } from '../filters/web-battlegrounds-time-filter-dropdown.component';

@Component({
	standalone: true,
	selector: 'battlegrounds-heroes',
	templateUrl: './battlegrounds-heroes.component.html',
	styleUrls: ['./battlegrounds-heroes.component.scss'],
	imports: [
		CommonModule,

		BattlegroundsViewModule,
		WebBattlegroundsFiltersComponent,
		WebBattlegroundsModeFilterDropdownComponent,
		WebBattlegroundsRankFilterDropdownComponent,
		WebBattlegroundsTimeFilterDropdownComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroesComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly BgsMetaHeroStatTierItem[]>;
	heroSort$: Observable<BgsHeroSortFilterType>;
	searchString$: Observable<string>;
	totalGames$: Observable<number>;
	lastUpdate$: Observable<Date>;

	readonly defaultDate = new Date();

	private heroSort$$ = new BehaviorSubject<BgsHeroSortFilterType>('tier');
	private searchString$$ = new BehaviorSubject<string>('');

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly metaHeroStats: BgsMetaHeroStatsAccessService,
		private readonly metaHeroStatsService: BgsMetaHeroStatsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.metaHeroStatsService, this.prefs);

		this.heroSort$ = this.heroSort$$.asObservable();
		this.searchString$ = this.searchString$$.asObservable();

		const config$: Observable<Config> = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => {
				return {
					gameMode: prefs.bgsActiveGameMode,
					anomaliesFilter: [] as readonly string[], // prefs.bgsActiveAnomaliesFilter,
					rankFilter: prefs.bgsActiveRankFilter,
					tribesFilter: prefs.bgsActiveTribesFilter,
					timeFilter: prefs.bgsActiveTimeFilter,
					options: {
						convervativeEstimate: true,
					},
				};
			}),
		);
		const statsProvider$: Observable<BgsHeroStatsV2> = config$.pipe(
			switchMap((config) =>
				config.gameMode === 'battlegrounds-duo'
					? this.metaHeroStats.loadMetaHeroStatsDuo(
							config.timeFilter,
							config.anomaliesFilter,
							config.rankFilter,
						)
					: this.metaHeroStats.loadMetaHeroStats(
							config.timeFilter,
							config.anomaliesFilter,
							config.rankFilter,
						),
			),
			tap((stats) =>
				console.debug(
					'[meta-stats] received stats',
					stats,
					stats.heroStats?.find((s) => s.heroCardId === 'TB_BaconShop_HERO_17'),
				),
			),
			takeUntil(this.destroyed$),
		);
		const metaData$ = statsProvider$.pipe(
			tap((stats) => console.debug('[meta-stats] received stats', stats)),
			this.mapData((stats) => ({
				totalGames: stats?.dataPoints,
				lastUpdate: stats?.lastUpdateDate,
			})),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.totalGames$ = metaData$.pipe(this.mapData((data) => data?.totalGames));
		this.lastUpdate$ = metaData$.pipe(
			this.mapData((data) => (data?.lastUpdate ? new Date(data.lastUpdate) : null)),
		);
		this.stats$ = combineLatest([config$, statsProvider$]).pipe(
			switchMap(([config, stats]) => this.metaHeroStatsService.getTiers(config, stats)),
			takeUntil(this.destroyed$),
		);

		this.cdr.detectChanges();
	}

	onHeroStatsClick(heroCardId: string) {
		// Handle hero detail navigation - could navigate to hero detail page
		console.log('Hero clicked:', heroCardId);
		// this.router.navigate(['/battlegrounds/hero', heroCardId]);
	}

	onSearchStringChange(searchString: string) {
		this.searchString$$.next(searchString);
	}
}
