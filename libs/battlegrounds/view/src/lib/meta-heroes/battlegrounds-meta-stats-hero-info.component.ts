/* eslint-disable no-mixed-spaces-and-tabs */
import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ALL_BG_RACES, GameType, defaultStartingHp, getTribeIcon, getTribeName } from '@firestone-hs/reference-data';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { SimpleBarChartData } from '@firestone/shared/common/view';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import {
	BattlegroundsHeroAveragePositionDetailsTooltipComponent,
	BgsHeroAveragePositionDetails,
} from './battlegrounds-hero-average-position-details-tooltip.component';

@Component({
	selector: 'battlegrounds-meta-stats-hero-info',
	styleUrls: [`./battlegrounds-meta-stats-hero-columns.scss`, `./battlegrounds-meta-stats-hero-info.component.scss`],
	template: `
		<div class="info" (click)="seeDetailedHeroStats()">
			<bgs-hero-portrait
				aria-hidden="true"
				class="portrait"
				[heroCardId]="heroCardId"
				[cardTooltip]="heroPowerCardId"
				[health]="heroStartingHealth"
			></bgs-hero-portrait>
			<div class="hero-details">
				<div class="name">{{ heroName }}</div>
				<div class="data-points">
					<div class="global">
						{{ dataPoints }}
					</div>
					<div
						class="player"
						*ngIf="playerDataPoints"
						[helpTooltip]="'app.battlegrounds.tier-list.player-data-points-tooltip' | fsTranslate"
					>
						(<span class="value">{{ playerDataPoints }}</span
						>)
					</div>
				</div>
			</div>
			<div class="position">
				<div
					class="global"
					cachedComponentTooltip
					[componentType]="averagePositionComponentType"
					[componentInput]="averagePositionTooltipInput"
					[componentTooltipCssClass]="'bgs-average-position-details'"
				>
					{{ averagePosition }}
				</div>
				<div
					class="player"
					*ngIf="playerAveragePosition !== null"
					[helpTooltip]="'app.battlegrounds.tier-list.player-average-position-tooltip' | fsTranslate"
				>
					<span class="value">{{ playerAveragePosition }}</span>
				</div>
				<!-- TODO: add tooltip that details the calculation -->
				<div
					class="tribe-impact"
					*ngIf="tribeImpactPosition !== null"
					[ngClass]="{ positive: tribeImpactPosition < 0, negative: tribeImpactPosition > 0 }"
					[helpTooltip]="'app.battlegrounds.tier-list.tribe-impact-position-tooltip' | fsTranslate"
				>
					<span class="value">{{ tribeImpactPosition.toFixed(2) }}</span>
				</div>
			</div>
			<div class="placement">
				<basic-bar-chart-2
					class="placement-distribution"
					[data]="placementChartData"
					[id]="'placementDistribution' + heroCardId"
					[midLineValue]="100 / 8"
					[offsetValue]="1"
				></basic-bar-chart-2>
			</div>
			<div class="tribes">
				<circular-progress
					class="tribe"
					*ngFor="let tribe of tribes"
					[imageUrl]="tribe.icon"
					[completionRate]="tribe.impactValue"
					[helpTooltip]="tribe.tooltip"
				>
				</circular-progress>
			</div>
			<div class="net-mmr">
				<div
					class="value"
					[ngClass]="{
						positive: netMmr > 0,
						negative: netMmr < 0,
						missing: buildValue(netMmr) === '-'
					}"
				>
					{{ buildValue(netMmr) }}
				</div>
			</div>
			<!-- Doesn't look good when squeezed so small, and has a high perf cost -->
			<!-- <div class="winrate">
				<bgs-winrate-chart [heroStat]="winrateContainer" [showYAxis]="true"></bgs-winrate-chart>
			</div> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsHeroInfoComponent {
	averagePositionComponentType: ComponentType<BattlegroundsHeroAveragePositionDetailsTooltipComponent> =
		BattlegroundsHeroAveragePositionDetailsTooltipComponent;

	@Output() heroStatClick = new EventEmitter<string>();

	@Input() set stat(value: BgsMetaHeroStatTierItem) {
		this.heroCardId = value.id;
		this.heroPowerCardId = value.heroPowerCardId;
		this.heroName = this.allCards.getCard(value.id).name;
		this.heroStartingHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, value.id, this.allCards);
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale()),
		});

		const showPlayerData = value.tribesFilter.length === ALL_BG_RACES.length && value.anomaliesFilter?.length === 0;
		this.playerDataPoints =
			// Only show the player full data when not filtering by tribes
			!!value.playerDataPoints && showPlayerData
				? this.i18n.translateString('app.battlegrounds.tier-list.player-data-points', {
						value: value.playerDataPoints.toLocaleString(this.i18n.formatCurrentLocale()),
				  })
				: null;
		this.averagePosition = value.averagePosition.toFixed(2);
		this.tribeImpactPosition = showPlayerData ? null : value.positionTribesModifier + value.positionAnomalyModifier;
		this.playerAveragePosition = showPlayerData ? value.playerAveragePosition?.toFixed(2) : null;
		this.averagePositionTooltipInput = {
			baseValue: value.averagePositionDetails.baseValue,
			tribeModifiers: value.averagePositionDetails.tribesModifiers,
			anomalyModifiers: value.averagePositionDetails.anomalyModifiers,
		};

		const globalPlacementChartData: SimpleBarChartData = {
			data: value.placementDistribution.map((p) => ({
				label: '' + p.rank,
				value: p.percentage,
			})),
		};
		this.placementChartData = [globalPlacementChartData];

		this.netMmr = value.playerNetMmr;

		this.tribes = value.tribeStats
			.map((stat) => {
				return {
					icon: getTribeIcon(stat.tribe),
					value: stat.impactAveragePosition,
					tooltip: this.i18n.translateString('app.battlegrounds.tier-list.tribe-info-tooltip', {
						tribe: getTribeName(stat.tribe, this.i18n),
						value: -stat.impactAveragePosition.toFixed(2),
					}),
					impactValue: Math.min(100, (100 * stat.impactAveragePosition) / 0.2),
				};
			})
			.sort((a, b) => a.value - b.value)
			.slice(0, 3);

		// this.winrateContainer = {
		// 	id: uuid(),
		// 	combatWinrate: value.combatWinrate,
		// };
	}

	heroCardId: string;
	heroPowerCardId: string;
	heroName: string;
	heroStartingHealth: number;
	dataPoints: string;
	playerDataPoints: string;
	averagePosition: string;
	playerAveragePosition: string;
	tribeImpactPosition: number;
	placementChartData: SimpleBarChartData[];
	netMmr: number;
	averagePositionTooltipInput: BgsHeroAveragePositionDetails;

	tribes: readonly TribeInfo[];
	// winrateContainer: { id: string; combatWinrate: readonly { turn: number; winrate: number }[] };

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	buildValue(value: number): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(0);
	}

	seeDetailedHeroStats() {
		this.heroStatClick.next(this.heroCardId);
	}
}

interface TribeInfo {
	readonly icon: string;
	readonly value: number;
	readonly tooltip: string;
	readonly impactValue: number;
}
