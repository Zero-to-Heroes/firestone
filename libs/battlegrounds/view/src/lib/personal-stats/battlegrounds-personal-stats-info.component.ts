/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardType, GameType, defaultStartingHp, getHeroPower } from '@firestone-hs/reference-data';

import { SimpleBarChartData } from '@firestone/shared/common/view';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsYourStat } from './your-stats.model';

@Component({
	selector: 'battlegrounds-presonal-stats-info',
	styleUrls: [`./battlegrounds-personal-stats-columns.scss`, `./battlegrounds-personal-stats-info.component.scss`],
	template: `
		<div class="info">
			<bgs-hero-portrait
				*ngIf="isHero"
				aria-hidden="true"
				class="portrait hero"
				[heroCardId]="heroCardId"
				[cardTooltip]="heroPowerCardId"
				[health]="heroStartingHealth"
			></bgs-hero-portrait>
			<div class="portrait non-hero" *ngIf="!isHero">
				<img [src]="nonHeroIcon" [cardTooltip]="heroCardId" [cardTooltipBgs]="true" />
			</div>
			<div class="hero-details">
				<div class="name">{{ heroName }}</div>
			</div>
			<div class="cell position">
				<span class="value">{{ averagePosition }}</span>
			</div>
			<div class="cell games-played">
				<div class="value">
					{{ gamesPlayed ?? '-' }}
				</div>
			</div>
			<div class="cell net-mmr">
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
			<div class="placement">
				<basic-bar-chart-2
					class="placement-distribution"
					[data]="placementChartData"
					[id]="'placementDistribution' + heroCardId"
					[midLineValue]="100 / 8"
					[offsetValue]="1"
				></basic-bar-chart-2>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsPersonalStatsInfoComponent {
	@Input() set stat(value: BattlegroundsYourStat) {
		this.heroCardId = value.cardId;
		this.isHero = this.allCards.getCard(value.cardId).type?.toUpperCase() === CardType[CardType.HERO];
		this.nonHeroIcon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.heroPowerCardId = getHeroPower(value.cardId, this.allCards);
		this.heroName = this.allCards.getCard(value.cardId).name;
		this.heroStartingHealth = defaultStartingHp(GameType.GT_BATTLEGROUNDS, value.cardId, this.allCards);
		this.gamesPlayed = this.i18n.translateString('app.battlegrounds.tier-list.player-data-points', {
			value: value.totalMatches.toLocaleString(this.i18n.formatCurrentLocale()),
		});
		this.averagePosition = value.averagePosition.toFixed(2);
		this.netMmr = value.netMmr;

		const globalPlacementChartData: SimpleBarChartData = !!value.totalMatches
			? {
					data: value.placementDistribution.map((p) => ({
						label: '' + p.placement,
						value: (100 * p.totalMatches) / value.totalMatches,
					})),
			  }
			: null;
		this.placementChartData = !!globalPlacementChartData ? [globalPlacementChartData] : null;
	}

	isHero: boolean;
	heroCardId: string;
	nonHeroIcon: string;
	heroPowerCardId: string;
	heroName: string;
	heroStartingHealth: number;
	gamesPlayed: string;
	averagePosition: string;
	netMmr: number;
	placementChartData: SimpleBarChartData[];

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	buildValue(value: number): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(0);
	}

	abs(value: number): number {
		return Math.abs(value);
	}
}
