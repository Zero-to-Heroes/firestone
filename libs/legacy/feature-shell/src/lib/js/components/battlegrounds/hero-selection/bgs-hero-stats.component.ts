import { ComponentType } from '@angular/cdk/portal';
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsPlayerHeroStatsService } from '@firestone/battlegrounds/common';
import { BgsQuestStat } from '@firestone/battlegrounds/core';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import {
	BattlegroundsHeroAveragePositionDetailsTooltipComponent,
	BgsHeroAveragePositionDetails,
} from '@firestone/battlegrounds/view';
import { SimpleBarChartData } from '@firestone/shared/common/view';
import { waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { BgsShowStrategiesEvent } from '../../../services/mainwindow/store/events/battlegrounds/bgs-show-strategies-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
import { BgsHeroStrategyTipsTooltipComponent } from './bgs-hero-strategy-tips-tooltip.component';

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
					[offsetValue]="1"
				></basic-bar-chart-2>
				<div class="entry average-position">
					<div
						class="label"
						[helpTooltip]="'battlegrounds.hero-stats.avg-position-tooltip' | owTranslate"
						[owTranslate]="'battlegrounds.hero-stats.avg-position-label'"
					></div>
					<div
						class="global-value"
						cachedComponentTooltip
						[componentType]="averagePositionComponentType"
						[componentInput]="averagePositionTooltipInput"
						[componentTooltipCssClass]="'bgs-average-position-details'"
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
			<div class="strategies">
				<div
					class="title"
					[owTranslate]="'app.battlegrounds.personal-stats.hero-details.tabs.strategies'"
				></div>
				<div
					class="strategies-link"
					[owTranslate]="'battlegrounds.hero-stats.strategies-link'"
					(click)="showStrategies()"
					componentTooltip
					[componentType]="componentType"
					[componentInput]="cardId"
				></div>
			</div>
			<!-- <div class="winrate" *ngIf="showTurnWinrates">
				<div
					class="title"
					[helpTooltip]="'battlegrounds.hero-stats.turn-winrate-tooltip' | owTranslate"
					[owTranslate]="'battlegrounds.hero-stats.turn-winrate'"
				></div>
				<bgs-winrate-chart [heroStat]="_hero" [showYAxis]="true"></bgs-winrate-chart>
			</div> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroStatsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	componentType: ComponentType<BgsHeroStrategyTipsTooltipComponent> = BgsHeroStrategyTipsTooltipComponent;
	averagePositionComponentType: ComponentType<BattlegroundsHeroAveragePositionDetailsTooltipComponent> =
		BattlegroundsHeroAveragePositionDetailsTooltipComponent;

	placementChartData$: Observable<SimpleBarChartData[]>;
	averagePosition: number;
	playerAveragePosition: number;
	totalPlayerMatches: number;
	cardId: string;
	_hero: BgsMetaHeroStatTierItem | BgsQuestStat;
	showTurnWinrates: boolean;
	averagePositionTooltipInput: BgsHeroAveragePositionDetails;

	private placementDistribution$: BehaviorSubject<readonly PlacementDistribution[]> = new BehaviorSubject(null);
	private playerPlacementDistribution$: BehaviorSubject<readonly PlacementDistribution[]> = new BehaviorSubject(null);

	@Input() set hero(value: BgsMetaHeroStatTierItem) {
		// | BgsQuestStat) {
		if (!value) {
			return;
		}
		this.cardId = value.id;
		this._hero = value;
		this.averagePosition = value.averagePosition;
		this.totalPlayerMatches = value.playerDataPoints;
		this.playerAveragePosition = value.playerAveragePosition;
		this.placementDistribution$.next(value.placementDistribution);
		this.playerPlacementDistribution$.next(value.playerPlacementDistribution);
		this.showTurnWinrates = !!(value as BgsMetaHeroStatTierItem)?.combatWinrate?.length;
		this.averagePositionTooltipInput = !value.averagePositionDetails
			? null
			: {
					baseValue: value.averagePositionDetails.baseValue,
					tribeModifiers: value.averagePositionDetails.tribesModifiers,
					anomalyModifiers: value.averagePositionDetails.anomalyModifiers,
			  };
	}

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly playerHeroStats: BgsPlayerHeroStatsService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.playerHeroStats);

		this.placementChartData$ = combineLatest([
			this.placementDistribution$.asObservable(),
			this.playerPlacementDistribution$.asObservable(),
			this.playerHeroStats.tiersWithPlayerData$$,
		]).pipe(
			filter(([global, player, globalStats]) => !!global && !!player && !!globalStats),
			map(([global, player, globalStats]) => ({
				global: global,
				player: player,
				maxGlobalValue: Math.max(
					...globalStats
						.map((stat) => Math.max(...stat.placementDistribution.map((info) => info.percentage)))
						.reduce((a, b) => a.concat(b), []),
				),
			})),
			this.mapData((info) => {
				const globalChartData: SimpleBarChartData = {
					data: info.global.map((info) => ({
						label: '' + info.rank,
						value: info.percentage,
					})),
				};
				const playerChartData: SimpleBarChartData = {
					data: info.player.map((info) => ({
						label: '' + info.rank,
						value: info.percentage,
					})),
				};
				return [globalChartData, playerChartData];
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	buildPercents(value: number): string {
		return value == null || isNaN(value) ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number): string {
		return value == null || isNaN(value) ? '-' : value.toFixed(2);
	}

	showStrategies() {
		this.store.send(new BgsShowStrategiesEvent(this._hero.baseCardId ?? this._hero.id));
	}
}

interface PlacementDistribution {
	readonly rank: number;
	readonly percentage: number;
}
