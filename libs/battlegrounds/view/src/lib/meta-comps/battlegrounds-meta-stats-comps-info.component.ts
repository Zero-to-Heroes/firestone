/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { capitalizeFirstLetter } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BgsMetaCompCard, BgsMetaCompStatTierItem } from './meta-comp.model';

@Component({
	standalone: false,
	selector: 'battlegrounds-meta-stats-comps-info',
	styleUrls: [
		`./battlegrounds-meta-stats-comps-columns.scss`,
		`./battlegrounds-meta-stats-comps-info.component.scss`,
	],
	template: `
		<div class="info clickable" (click)="onCompositionClick()">
			<div class="background">
				<div class="background-image" *ngFor="let card of coreCardArts">
					<img [src]="card" />
				</div>
			</div>
			<div class="cell name">
				<div class="text">{{ compName }}</div>
				<div class="data-points">
					{{ dataPoints }}
				</div>
			</div>
			<div class="cell first-percent">{{ firstPercent | number: '1.1-1' }}</div>
			<div class="cell average-placement">{{ averagePlacement }}</div>
			<div class="cell expert-rating {{ expertRating?.toLowerCase() }}">{{ expertRating }}</div>
			<div class="cell expert-difficulty {{ expertDifficulty }}">{{ expertDifficultyStr }}</div>
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
	@Output() compositionClick = new EventEmitter<BgsMetaCompStatTierItem>();

	@Input() set stat(value: BgsMetaCompStatTierItem) {
		this._stat = value;
		this.compId = value.compId;
		this.compName = value.name;
		this.firstPercent = value.firstPercent * 100;
		this.expertRating = capitalizeFirstLetter(value.expertRating);
		this.expertDifficulty = value.expertDifficulty?.toLowerCase();
		this.expertDifficultyStr = this.i18n.translateString(
			`battlegrounds.in-game.minions-list.compositions.difficulty.${this.expertDifficulty}`,
		);
		this.dataPoints = this.i18n.translateString('app.battlegrounds.tier-list.data-points', {
			value: value.dataPoints.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
		});
		this.averagePlacement = this.buildValue(value.averagePlacement);
		this.coreCards = value.coreCards;
		this.addonCards = value.addonCards;
		this.coreCardArts = value.coreCards
			.slice(0, 3)
			.map((card) => `https://static.zerotoheroes.com/hearthstone/cardart/tiles/${card.cardId}.png`);
	}

	private _stat: BgsMetaCompStatTierItem;
	compId: string;
	compName: string;
	dataPoints: string;
	firstPercent: number;
	expertRating: string | null;
	expertDifficulty: string | null;
	expertDifficultyStr: string | null;
	coreCards: readonly BgsMetaCompCard[];
	addonCards: readonly BgsMetaCompCard[];
	impactValue: number;
	impact: string;
	averagePlacement: string;
	averagePlacementHighMmr: string;
	pickRate: string;
	pickRateHighMmr: string;
	coreCardArts: string[];

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {}

	onCompositionClick() {
		this.compositionClick.emit(this._stat);
	}

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
