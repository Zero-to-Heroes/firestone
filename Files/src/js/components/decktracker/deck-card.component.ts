import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { DeckCard } from '../../models/decktracker/deck-card';

@Component({
	selector: 'deck-card',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/deck-card.component.scss',
	],
	template: `
		<div class="deck-card" [ngClass]="{'legendary': rarity === 'legendary'}">
			<div class="background-image" [style.background-image]="cardImage"></div>
			<div class="gradiant"></div>
			<div class="mana-cost"><span>{{manaCost}}</span></div>
			<div class="card-name"><span>{{cardName}}</span></div>
			<div class="number-of-copies" *ngIf="numberOfCopies > 1">
				<div class="inner-border">
					<span>{{numberOfCopies}}</span>
				</div>
			</div>
			<div class="legendary-symbol" *ngIf="numberOfCopies === 1 && rarity === 'legendary'">
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#legendary_star"/>
						</svg>
					</i>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckCardComponent {

	cardImage: string;
	manaCost: number;
	cardName: string;
	rarity: string;
	numberOfCopies: number;

	@Input('card') set card(card: DeckCard) {
		this.cardImage = `url(http://static.zerotoheroes.com/hearthstone/cardart/tiles/${card.cardId}.jpg)`;
		this.manaCost = card.manaCost;
		this.cardName = card.cardName;
		this.numberOfCopies = card.totalQuantity;
		this.rarity = card.rarity;
		if (this.numberOfCopies <= 0) {
			console.error('invalid number of copies', card);
		}
	}
}