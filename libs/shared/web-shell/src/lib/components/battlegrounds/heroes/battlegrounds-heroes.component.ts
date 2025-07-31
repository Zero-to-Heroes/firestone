import { CommonModule } from '@angular/common';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { BattlegroundsViewModule, BgsHeroSortFilterType } from '@firestone/battlegrounds/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Component({
	standalone: true,
	selector: 'battlegrounds-heroes',
	template: `
		<battlegrounds-meta-stats-heroes-view
			*ngIf="{
				stats: stats$ | async,
				heroSort: heroSort$ | async,
				searchString: searchString$ | async,
				totalGames: totalGames$ | async,
				lastUpdate: lastUpdate$ | async,
			} as data"
			[stats]="data.stats || []"
			[heroSort]="data.heroSort || 'tier'"
			[searchString]="data.searchString || ''"
			[totalGames]="data.totalGames || 0"
			[lastUpdate]="data.lastUpdate || defaultDate"
			(heroStatClick)="onHeroStatsClick($event)"
			(searchStringChange)="onSearchStringChange($event)"
		></battlegrounds-meta-stats-heroes-view>
	`,
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
	) {
		super(cdr);
	}

	ngAfterContentInit() {
		// Initialize observables
		this.heroSort$ = this.heroSort$$.asObservable();
		this.searchString$ = this.searchString$$.asObservable();

		// For now, provide mock data - replace with real API calls later
		this.stats$ = this.loadMockHeroStats();
		this.totalGames$ = of(50000);
		this.lastUpdate$ = of(new Date());
	}

	onHeroStatsClick(heroCardId: string) {
		// Handle hero detail navigation - could navigate to hero detail page
		console.log('Hero clicked:', heroCardId);
		// this.router.navigate(['/battlegrounds/hero', heroCardId]);
	}

	onSearchStringChange(searchString: string) {
		this.searchString$$.next(searchString);
	}

	private loadMockHeroStats(): Observable<readonly BgsMetaHeroStatTierItem[]> {
		// Mock data for now - replace with real API service
		const mockStats: BgsMetaHeroStatTierItem[] = [
			{
				id: 'TB_BaconUps_100',
				name: 'Flurgl',
				baseCardId: 'TB_BaconUps_100',
				heroPowerCardId: 'TB_BaconUps_100_HP',
				dataPoints: 5000,
				averagePosition: 4.1,
				averagePositionDetails: {
					baseValue: 4.1,
					tribesModifiers: [],
					allTribesAveragePositionModifierDetails: [],
				},
				pickrate: 15.5,
				positionTribesModifier: 0,
				placementDistribution: [
					{ rank: 1, percentage: 12.5 },
					{ rank: 2, percentage: 15.2 },
					{ rank: 3, percentage: 18.1 },
					{ rank: 4, percentage: 20.3 },
					{ rank: 5, percentage: 16.7 },
					{ rank: 6, percentage: 10.1 },
					{ rank: 7, percentage: 4.8 },
					{ rank: 8, percentage: 2.3 },
				],
				combatWinrate: [],
				warbandStats: [],
				tribeStats: [],
				top1: 12.5,
				top4: 66.1,
				playerAveragePosition: 4.2,
				playerDataPoints: 1250,
				playerNetMmr: 45,
				playerLastPlayedTimestamp: Date.now() - 86400000, // 1 day ago
				playerTop1: 15.2,
				playerTop4: 68.5,
			},
			{
				id: 'TB_BaconUps_101',
				name: 'Millhouse Manastorm',
				baseCardId: 'TB_BaconUps_101',
				heroPowerCardId: 'TB_BaconUps_101_HP',
				dataPoints: 3200,
				averagePosition: 5.3,
				averagePositionDetails: {
					baseValue: 5.3,
					tribesModifiers: [],
					allTribesAveragePositionModifierDetails: [],
				},
				pickrate: 8.2,
				positionTribesModifier: 0,
				placementDistribution: [
					{ rank: 1, percentage: 8.1 },
					{ rank: 2, percentage: 10.5 },
					{ rank: 3, percentage: 14.2 },
					{ rank: 4, percentage: 18.7 },
					{ rank: 5, percentage: 19.3 },
					{ rank: 6, percentage: 15.8 },
					{ rank: 7, percentage: 8.9 },
					{ rank: 8, percentage: 4.5 },
				],
				combatWinrate: [],
				warbandStats: [],
				tribeStats: [],
				top1: 8.1,
				top4: 51.5,
				playerAveragePosition: 5.1,
				playerDataPoints: 890,
				playerNetMmr: -12,
				playerLastPlayedTimestamp: Date.now() - 172800000, // 2 days ago
				playerTop1: 9.2,
				playerTop4: 53.1,
			},
			// Add more mock heroes as needed
		];

		return of(mockStats);
	}
}
