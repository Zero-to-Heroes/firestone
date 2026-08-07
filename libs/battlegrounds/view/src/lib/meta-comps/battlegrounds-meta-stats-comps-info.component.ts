/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { capitalizeFirstLetter } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import type { BgsMetaCompCard, BgsMetaCompStatTierItem } from './meta-comp.model';

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
			</div>
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
			<!-- <div class="cell cards recommended">
				<div class="card-container" *ngFor="let card of recommendedCards">
					<card-on-board
						class="card"
						[entity]="card.entity"
						[cardTooltip]="card.cardId"
						[cardTooltipBgs]="true"
					>
					</card-on-board>
				</div>
			</div> -->
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
		this.expertRating = capitalizeFirstLetter(value.expertRating);
		this.expertDifficulty = value.expertDifficulty?.toLowerCase();
		this.expertDifficultyStr = this.i18n.translateString(
			`battlegrounds.in-game.minions-list.compositions.difficulty.${this.expertDifficulty}`,
		);
		this.coreCards = value.coreCards;
		this.addonCards = value.addonCards;
		this.recommendedCards = value.recommendedCards;
		this.cycleCards = value.cycleCards;
		this.coreCardArts = value.coreCards
			.slice(0, 3)
			.map((card) => `https://static.zerotoheroes.com/hearthstone/cardart/tiles/${card.cardId}.png`);
	}

	private _stat: BgsMetaCompStatTierItem;
	compId: string;
	compName: string;
	expertRating: string | null;
	expertDifficulty: string | null;
	expertDifficultyStr: string | null;
	coreCards: readonly BgsMetaCompCard[];
	addonCards: readonly BgsMetaCompCard[];
	recommendedCards: readonly BgsMetaCompCard[];
	cycleCards: readonly BgsMetaCompCard[];
	coreCardArts: string[];

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
	) {}

	onCompositionClick() {
		this.compositionClick.emit(this._stat);
	}
}
