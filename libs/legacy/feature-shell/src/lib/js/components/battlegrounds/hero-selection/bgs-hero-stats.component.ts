import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { BgsHeroStat, BgsQuestStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { sumOnArray } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { SimpleBarChartData } from '../../common/chart/simple-bar-chart-data';

@Component({
	selector: 'bgs-hero-stats',
	styleUrls: [
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-stats.component.scss`,
	],
	template: `
		<div class="stats">
			<div class="placement">
				<div class="title" [owTranslate]="'battlegrounds.hero-stats.finishes-title'"></div>
				<basic-bar-chart-2
					class="placement-distribution"
					[data]="placementChartData$ | async"
					[id]="'placementDistribution' + cardId"
					[midLineValue]="100 / 8"
				></basic-bar-chart-2>
				<div class="entry average-position">
					<div
						class="label"
						[helpTooltip]="'battlegrounds.hero-stats.avg-position-tooltip' | owTranslate"
						[owTranslate]="'battlegrounds.hero-stats.avg-position-label'"
					></div>
					<div
						class="global-value"
						[helpTooltip]="'battlegrounds.hero-stats.avg-position-global-tooltip' | owTranslate"
					>
						{{ buildValue(averagePosition) }}
					</div>
					<div
						class="player-value"
						[helpTooltip]="'battlegrounds.hero-stats.avg-position-your-tooltip' | owTranslate"
					>
						({{ buildValue(playerAveragePosition) }})
					</div>
				</div>
				<div class="entry matches-played">
					<div
						class="label"
						[helpTooltip]="'battlegrounds.hero-stats.matches-played-tooltip' | owTranslate"
						[owTranslate]="'battlegrounds.hero-stats.matches-played-label'"
					></div>
					<div
						class="player-value"
						[helpTooltip]="'battlegrounds.hero-stats.avg-position-your-tooltip' | owTranslate"
					>
						{{ totalPlayerMatches }}
					</div>
				</div>
			</div>
			<div class="winrate" *ngIf="showTurnWinrates">
				<div
					class="title"
					[helpTooltip]="'battlegrounds.hero-stats.turn-winrate-tooltip' | owTranslate"
					[owTranslate]="'battlegrounds.hero-stats.turn-winrate'"
				></div>
				<bgs-winrate-chart [heroStat]="_hero" [showYAxis]="true"></bgs-winrate-chart>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	placementChartData$: Observable<SimpleBarChartData[]>;
	averagePosition: number;
	playerAveragePosition: number;
	totalPlayerMatches: number;
	cardId: string;
	_hero: BgsHeroStat | BgsQuestStat;
	showTurnWinrates: boolean;

	private placementDistribution$: BehaviorSubject<readonly PlacementDistribution[]> = new BehaviorSubject(null);
	private playerPlacementDistribution$: BehaviorSubject<readonly PlacementDistribution[]> = new BehaviorSubject(null);

	@Input() set hero(value: BgsHeroStat | BgsQuestStat) {
		if (!value) {
			return;
		}
		this.cardId = value.id;
		this._hero = value;
		this.averagePosition = value.averagePosition;
		this.totalPlayerMatches = value.playerGamesPlayed;
		this.playerAveragePosition = value.playerAveragePosition;
		this.placementDistribution$.next(value.placementDistribution);
		this.playerPlacementDistribution$.next(value.playerPlacementDistribution);
		this.showTurnWinrates = !!(value as BgsHeroStat)?.combatWinrate?.length;
	}

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.placementChartData$ = combineLatest(
			this.placementDistribution$.asObservable(),
			this.playerPlacementDistribution$.asObservable(),
			this.store.bgHeroStats$(),
		).pipe(
			filter(([global, player, globalStats]) => !!global && !!player && !!globalStats),
			map(
				([global, player, globalStats]) =>
					[
						global,
						player,
						Math.max(
							...globalStats
								.map((stat) => {
									const totalStatMatches = sumOnArray(
										stat.placementDistribution,
										(info) => info.totalMatches,
									);
									const highestStatValue = Math.max(
										...stat.placementDistribution.map(
											(info) => info.totalMatches / totalStatMatches,
										),
									);
									return highestStatValue;
								})
								.reduce((a, b) => a.concat(b), []),
						),
					] as [readonly PlacementDistribution[], readonly PlacementDistribution[], number],
			),
			this.mapData(([global, player, maxGlobalValue]) => {
				const totalGlobalMatches = sumOnArray(global, (info) => info.totalMatches);
				const globalChartData: SimpleBarChartData = {
					data: global.map((info) => ({
						label: '' + info.rank,
						value: (100 * info.totalMatches) / totalGlobalMatches,
						rawValue: info.totalMatches,
					})),
				};
				const totalPlayerMatches = sumOnArray(player, (info) => info.totalMatches);
				const playerChartData: SimpleBarChartData = {
					data: player.map((info) => ({
						label: '' + info.rank,
						value: totalPlayerMatches ? (100 * info.totalMatches) / totalPlayerMatches : 0,
						rawValue: info.totalMatches,
					})),
				};
				return [globalChartData, playerChartData];
			}),
		);
	}

	buildPercents(value: number): string {
		return value == null || isNaN(value) ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number): string {
		return value == null || isNaN(value) ? '-' : value.toFixed(2);
	}
}

interface PlacementDistribution {
	readonly rank: number;
	readonly totalMatches: number;
}
