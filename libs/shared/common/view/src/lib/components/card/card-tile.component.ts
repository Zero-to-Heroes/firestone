import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Component({
	selector: 'card-tile',
	styleUrls: ['./card-tile.component.scss'],
	template: `
		<div
			class="deck-card {{ rarity }} {{ cardClass }}"
			[ngClass]="{
				'color-mana-cost': true,
				'color-class-cards': false
			}"
			[cardTooltip]="_cardId"
			[cardTooltipPosition]="'auto'"
			[cardTooltipShowRelatedCards]="true"
			[cardTooltipRelatedCardIds]="relatedCardIds"
		>
			<div class="background-image" [style.background-image]="cardImage"></div>
			<div class="mana-cost">
				<span>{{ manaCostStr }}</span>
			</div>
			<div class="missing-overlay"></div>
			<div class="gradiant"></div>
			<div class="card-name">
				<span>{{ cardName }}</span>
			</div>
			<div class="number-of-copies" *ngIf="numberOfCopies > 1">
				<div class="inner-border">
					<span>{{ numberOfCopies }}</span>
				</div>
			</div>
			<div class="legendary-symbol" *ngIf="rarity === 'legendary'">
				<div class="inner-border">
					<div class="svg-container" inlineSVG="assets/svg/card_legendary.svg"></div>
				</div>
			</div>
			<div class="linked-card-overlay"></div>
			<div class="mouse-over"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTileComponent {
	@Input() set cardId(value: string) {
		this._cardId = value;
		const refCard: ReferenceCard = this.allCards.getCard(value);
		this.rarity = refCard.rarity?.toLowerCase();
		this.cardClass = refCard.classes?.[0]?.toLowerCase();
		this.relatedCardIds = refCard.relatedCardDbfIds?.map((dbfId) => this.allCards.getCard(dbfId).id) ?? [];
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${value}.jpg)`;
		this.manaCostStr = refCard.hideStats ? '' : refCard.cost?.toString() ?? '?';
		this.cardName = refCard.name;
	}
	@Input() numberOfCopies: number;

	_cardId: string;
	cardImage: string;
	manaCostStr: string;
	cardName: string;
	rarity: string;
	cardClass: string;
	relatedCardIds: readonly string[];

	constructor(private readonly allCards: CardsFacadeService) {}
}
