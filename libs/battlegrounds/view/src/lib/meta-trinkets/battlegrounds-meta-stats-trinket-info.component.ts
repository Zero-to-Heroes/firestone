/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsMetaTrinketStatTierItem } from '@firestone/battlegrounds/data-access';
import { buildPercents } from '@firestone/shared/framework/common';

import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';

@Component({
	selector: 'battlegrounds-meta-stats-trinket-info',
	styleUrls: [
		`./battlegrounds-meta-stats-trinkets-columns.scss`,
		`./battlegrounds-meta-stats-trinket-info.component.scss`,
	],
	template: `
		<div class="info">
			<div class="cell image" [cardTooltip]="trinketCardId" [cardTooltipBgs]="true">
				<img class="icon" [src]="icon" />
			</div>
			<div class="cell name">
				<div class="text">{{ trinketName }}</div>
				<div class="data-points">
					{{ dataPoints }}
				</div>
			</div>
			<div class="cell average-placement">{{ averagePlacement }}</div>
			<div class="cell average-placement-high-mmr">{{ averagePlacementHighMmr }}</div>
			<div class="cell pick-rate">{{ pickRate }}</div>
			<div class="cell pick-rate-high-mmr">{{ pickRateHighMmr }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsTrinketInfoComponent {
	@Input() set stat(value: BgsMetaTrinketStatTierItem) {
		this.trinketCardId = value.cardId;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.trinketName = value.name;
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale()),
		});
		this.averagePlacement = this.buildValue(value.averagePlacement);
		this.averagePlacementHighMmr = this.buildValue(value.averagePlacementTop25);
		this.pickRate = buildPercents(value.pickRate, this.i18n.formatCurrentLocale());
		this.pickRateHighMmr = buildPercents(value.pickRateTop25, this.i18n.formatCurrentLocale());
	}

	trinketCardId: string;
	icon: string;
	trinketName: string;
	dataPoints: string;

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
			: value.toLocaleString(this.i18n.formatCurrentLocale(), {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
			  });
	}
}
