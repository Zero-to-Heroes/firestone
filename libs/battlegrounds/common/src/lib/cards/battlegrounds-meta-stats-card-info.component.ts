/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaCardStatTierItem } from '@firestone/battlegrounds/data-access';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'battlegrounds-meta-stats-card-info',
	styleUrls: [`./battlegrounds-meta-stats-cards-columns.scss`, `./battlegrounds-meta-stats-card-info.component.scss`],
	template: `
		<div class="info">
			<div class="cell image" [cardTooltip]="cardCardId" [cardTooltipBgs]="true">
				<tavern-level-icon *ngIf="tavernTier" [level]="tavernTier" class="tavern"></tavern-level-icon>
				<img class="icon" [src]="icon" />
			</div>
			<div class="cell name">
				<div class="text">{{ cardName }}</div>
				<div class="data-points">
					{{ dataPoints }}
				</div>
			</div>
			<!-- <div class="cell average-placement">{{ averagePlacement }}</div> -->
			<div class="cell impact" [ngClass]="{ positive: impactValue < 0 }">{{ impact }}</div>
			<!-- <div class="cell average-placement-high-mmr">{{ averagePlacementHighMmr }}</div>
			<div class="cell pick-rate">{{ pickRate }}</div>
			<div class="cell pick-rate-high-mmr">{{ pickRateHighMmr }}</div> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsCardInfoComponent {
	@Input() set stat(value: BgsMetaCardStatTierItem) {
		this.cardCardId = value.cardId;
		this.tavernTier = this.allCards.getCard(value.cardId).techLevel;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.cardName = value.name;
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
		});
		this.averagePlacement = this.buildValue(value.averagePlacement);
		this.impactValue = value.impact;
		this.impact = this.buildValue(Math.abs(value.impact));
		// this.averagePlacementHighMmr = this.buildValue(value.averagePlacementTop25);
		// this.pickRate = buildPercents(value.pickRate, this.i18n.formatCurrentLocale());
		// this.pickRateHighMmr = buildPercents(value.pickRateTop25, this.i18n.formatCurrentLocale());
	}

	cardCardId: string;
	tavernTier: number | undefined;
	icon: string;
	cardName: string;
	dataPoints: string;

	impactValue: number;
	impact: string;
	averagePlacement: string;
	averagePlacementHighMmr: string;
	pickRate: string;
	pickRateHighMmr: string;

	constructor(private readonly allCards: CardsFacadeService, private readonly i18n: ILocalizationService) {}

	buildValue(value: number): string {
		return value == null
			? '-'
			: value === 0
			? '0'
			: value.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
			  });
	}
}
