import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { BgsHeroStatsV2 } from '@firestone-hs/bgs-global-stats';
import { BgsMetaHeroStatsService } from '@firestone/battlegrounds/common';
import { BgsMetaHeroStatsAccessService, BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { BattlegroundsViewModule, BgsHeroSortFilterType } from '@firestone/battlegrounds/view';
import { Config } from '@firestone/game-state';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, from, Observable, shareReplay, switchMap, takeUntil, tap } from 'rxjs';

@Component({
	standalone: true,
	selector: 'battlegrounds-heroes',
	templateUrl: './battlegrounds-heroes.component.html',
	styleUrls: ['./battlegrounds-heroes.component.scss'],
	imports: [CommonModule, BattlegroundsViewModule],
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
		private readonly router: Router,
		private readonly metaHeroStats: BgsMetaHeroStatsAccessService,
		private readonly metaHeroStatsService: BgsMetaHeroStatsService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.heroSort$ = this.heroSort$$.asObservable();
		this.searchString$ = this.searchString$$.asObservable();

		const config: Config = {
			gameMode: 'battlegrounds',
			anomaliesFilter: [] as readonly string[], // prefs.bgsActiveAnomaliesFilter,
			rankFilter: 100,
			tribesFilter: [],
			timeFilter: 'last-patch',
			options: {
				convervativeEstimate: true,
			},
		};
		const statsProvider$: Observable<BgsHeroStatsV2> = from(
			this.metaHeroStats.loadMetaHeroStats(config.timeFilter, config.anomaliesFilter, config.rankFilter),
		).pipe(takeUntil(this.destroyed$));
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
		this.stats$ = statsProvider$.pipe(
			switchMap((stats) => this.metaHeroStatsService.getTiers(config, stats)),
			takeUntil(this.destroyed$),
		);
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
