import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	ViewRef,
} from '@angular/core';
import {
	BattlegroundsNavigationService,
	BgsMetaHeroStatsDuoService,
	BgsMetaHeroStatsService,
	BgsPlayerHeroStatsService,
} from '@firestone/battlegrounds/common';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { BgsHeroSortFilterType } from '@firestone/battlegrounds/view';
import { Config } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '@legacy-import/src/lib/js/services/mainwindow/store/events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { MainWindowStoreEvent } from '@legacy-import/src/lib/js/services/mainwindow/store/events/main-window-store-event';
import { Observable, shareReplay, switchMap, takeUntil, tap } from 'rxjs';

@Component({
	standalone: false,
	selector: 'battlegrounds-meta-stats-heroes',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-heroes.component.scss`,
	],
	template: `
		<battlegrounds-meta-stats-heroes-view
			[stats]="stats$ | async"
			[searchString]="searchString$ | async"
			[totalGames]="totalGames$ | async"
			[lastUpdate]="lastUpdate$ | async"
			(heroStatClick)="onHeroStatsClick($event)"
			(searchStringChange)="onSearchStringChange($event)"
		></battlegrounds-meta-stats-heroes-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsHeroesComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly BgsMetaHeroStatTierItem[]>;
	searchString$: Observable<string>;
	heroSort$: Observable<BgsHeroSortFilterType>;
	totalGames$: Observable<number>;
	lastUpdate$: Observable<Date>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly playerHeroStats: BgsPlayerHeroStatsService,
		private readonly metaHeroStats: BgsMetaHeroStatsService,
		private readonly metaHeroStatsDuo: BgsMetaHeroStatsDuoService,
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.metaHeroStats, this.metaHeroStatsDuo, this.playerHeroStats, this.prefs, this.nav);

		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		this.stats$ = this.playerHeroStats.tiersWithPlayerData$$.pipe(
			this.mapData((stats) => {
				const maxTribeImpact = Math.max(
					...(stats ?? [])
						.flatMap((s) => s.tribeStats)
						.filter((t) => t.impactAveragePosition < 0)
						.map((t) => -t.impactAveragePosition),
				);
				return stats?.map((s) => ({ ...s, maxTribeImpact })) ?? [];
			}),
		);
		// this.heroSort$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsActiveHeroSortFilter));
		this.searchString$ = this.nav.heroSearchString$$;
		const statsProvider$ = this.prefs.preferences$$.pipe(
			switchMap((prefs) => {
				const config: Config = {
					gameMode: prefs.bgsActiveGameMode,
					anomaliesFilter: [] as readonly string[], // prefs.bgsActiveAnomaliesFilter,
					rankFilter: prefs.bgsActiveRankFilter,
					tribesFilter: prefs.bgsActiveTribesFilter,
					timeFilter: prefs.bgsActiveTimeFilter,
					options: {
						convervativeEstimate: prefs.bgsHeroesUseConservativeEstimate,
					},
				};
				return prefs.bgsActiveGameMode === 'battlegrounds'
					? this.metaHeroStats.getStats(config)
					: this.metaHeroStatsDuo.getStats(config);
			}),
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

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	onHeroStatsClick(heroCardId: string) {
		this.stateUpdater.next(new BgsPersonalStatsSelectHeroDetailsEvent(heroCardId));
	}

	onSearchStringChange(value: string) {
		this.nav.heroSearchString$$.next(value);
	}
}
