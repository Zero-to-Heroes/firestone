import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SimpleBarChartData } from '@components/common/chart/simple-bar-chart-data';
import { GameType } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BgsMetaHeroStatTierItem } from '@legacy-import/src/lib/js/services/battlegrounds/bgs-meta-hero-stats';
import { defaultStartingHp } from '@legacy-import/src/lib/js/services/hs-utils';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { BgsPersonalStatsSelectHeroDetailsEvent } from '@legacy-import/src/lib/js/services/mainwindow/store/events/battlegrounds/bgs-personal-stats-select-hero-details-event';
import { AppUiStoreFacadeService } from '@legacy-import/src/lib/js/services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'battlegrounds-meta-stats-hero-info',
	styleUrls: [
		`../../../../../../css/component/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-hero-columns.scss`,
		`../../../../../../css/component/battlegrounds/desktop/categories/meta/battlegrounds-meta-stats-hero-info.component.scss`,
	],
	template: `
		<div class="info" (click)="seeDetailedHeroStats()">
			<bgs-hero-portrait
				aria-hidden="true"
				class="portrait"
				[heroCardId]="heroCardId"
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
						[helpTooltip]="'app.battlegrounds.tier-list.player-data-points-tooltip' | owTranslate"
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
					[helpTooltip]="'app.battlegrounds.tier-list.player-average-position-tooltip' | owTranslate"
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
	@Input() set stat(value: BgsMetaHeroStatTierItem) {
		this.heroCardId = value.heroCardId;
		this.heroName = this.allCards.getCard(value.heroCardId).name;
		this.heroStartingHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, value.heroCardId);
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
	heroName: string;
	heroStartingHealth: number;
	dataPoints: string;
	playerDataPoints: string;
	averagePosition: string;
	playerAveragePosition: string;
	placementChartData: SimpleBarChartData[];
	netMmr: number;
	// winrateContainer: { id: string; combatWinrate: readonly { turn: number; winrate: number }[] };

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly store: AppUiStoreFacadeService,
	) {}

	buildValue(value: number): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(0);
	}

	seeDetailedHeroStats() {
		this.store.send(new BgsPersonalStatsSelectHeroDetailsEvent(this.heroCardId));
	}
}
