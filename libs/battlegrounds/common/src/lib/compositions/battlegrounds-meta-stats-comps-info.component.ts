/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { capitalizeFirstLetter } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BgsMetaCompCard, BgsMetaCompStatTierItem } from './meta-comp.model';

@Component({
	selector: 'battlegrounds-meta-stats-comps-info',
	styleUrls: [
		`./battlegrounds-meta-stats-comps-columns.scss`,
		`./battlegrounds-meta-stats-comps-info.component.scss`,
	],
	template: `
		<div class="info">
			<div class="cell name">
				<div class="text">{{ compName }}</div>
				<div class="data-points">
					{{ dataPoints }}
				</div>
			</div>
			<div class="cell first-percent">{{ firstPercent | number: '1.1-1' }}</div>
			<div class="cell average-placement">{{ averagePlacement }}</div>
			<div class="cell expert-rating {{ expertRating?.toLowerCase() }}">{{ expertRating }}</div>
			<div class="cell expert-difficulty {{ expertDifficulty?.toLowerCase() }}">{{ expertDifficulty }}</div>
			<div class="cell cards core">
				<div class="card-container" *ngFor="let card of coreCards">
					<card-on-board
						class="card"
						[entity]="card.entity"
						[cardTooltip]="card.cardId"
						[cardTooltipBgs]="true"
					>
					</card-on-board>
				</div>
			</div>
			<div class="cell cards addon">
				<div class="card-container" *ngFor="let card of addonCards">
					<card-on-board
						class="card"
						[entity]="card.entity"
						[cardTooltip]="card.cardId"
						[cardTooltipBgs]="true"
					>
					</card-on-board>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsCompInfoComponent {
	@Input() set stat(value: BgsMetaCompStatTierItem) {
		this.compId = value.compId;
		this.compName = value.name;
		this.firstPercent = value.firstPercent * 100;
		this.expertRating = capitalizeFirstLetter(value.expertRating);
		this.expertDifficulty = capitalizeFirstLetter(value.expertDifficulty);
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
		});
		this.averagePlacement = this.buildValue(value.averagePlacement);
		this.coreCards = value.coreCards;
		this.addonCards = value.addonCards;
	}

	compId: string;
	compName: string;
	dataPoints: string;
	firstPercent: number;
	expertRating: string | null;
	expertDifficulty: string | null;
	coreCards: readonly BgsMetaCompCard[];
	addonCards: readonly BgsMetaCompCard[];
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
