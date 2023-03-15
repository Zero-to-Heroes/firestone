/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { defaultStartingHp, GameType } from '@firestone-hs/reference-data';
import { BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';
import { SimpleBarChartData } from '@firestone/shared/common/view';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

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
				<div class="global">{{ averagePosition }}</div>
				<div
					class="player"
					*ngIf="playerAveragePosition"
					[helpTooltip]="'app.battlegrounds.tier-list.player-average-position-tooltip' | fsTranslate"
				>
					(<span class="value">{{ playerAveragePosition }}</span
					>)
				</div>
			</div>
			<div class="placement">
				<basic-bar-chart-2
					class="placement-distribution"
					[data]="placementChartData"
					[id]="'placementDistribution' + heroCardId"
					[midLineValue]="100 / 8"
				></basic-bar-chart-2>
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
	@Output() heroStatClick = new EventEmitter<string>();

	@Input() set stat(value: BgsMetaHeroStatTierItem) {
		this.heroCardId = value.id;
		this.heroPowerCardId = value.heroPowerCardId;
		this.heroName = this.allCards.getCard(value.id).name;
		this.heroStartingHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, value.id, this.allCards);
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale()),
		});
		this.playerDataPoints = !!value.playerDataPoints
			? this.i18n.translateString('app.battlegrounds.tier-list.player-data-points', {
					value: value.playerDataPoints.toLocaleString(this.i18n.formatCurrentLocale()),
			  })
			: null;
		this.averagePosition = value.averagePosition.toFixed(2);
		this.playerAveragePosition = value.playerAveragePosition?.toFixed(2);

		const globalPlacementChartData: SimpleBarChartData = {
			data: value.placementDistribution.map((p) => ({
				label: '' + p.rank,
				value: p.percentage,
			})),
		};
		this.placementChartData = [globalPlacementChartData];

		this.netMmr = value.playerNetMmr;

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
	placementChartData: SimpleBarChartData[];
	netMmr: number;
	// winrateContainer: { id: string; combatWinrate: readonly { turn: number; winrate: number }[] };

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	buildValue(value: number): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(0);
	}

	seeDetailedHeroStats() {
		this.heroStatClick.next(this.heroCardId);
	}
}
