import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DeckCard, DeckHandlerService } from '@firestone/game-state';
import { groupByFunction } from '../../../services/utils';
import { CardsByCost } from './cards-by-cost';

@Component({
	standalone: false,
	selector: 'deck-mana-curve',
	styleUrls: [`../../../../css/component/decktracker/main/deck-mana-curve.component.scss`],
	template: `
		<div class="deck-mana-curve">
			<deck-mana-curve-bar
				*ngFor="let cardByCost of cardsByCost"
				[info]="cardByCost"
				[maxQuantity]="maxQuantity"
			></deck-mana-curve-bar>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckManaCurveComponent {
	@Input() set deckstring(value: string) {
		if (!value) {
			return;
		}

		const cards = this.deckHandler.buildDeckList(value);
		const groupedByCost = groupByFunction((card: DeckCard) => '' + Math.min(7, card.refManaCost))(cards);
		const cardsByCost: CardsByCost[] = [];
		for (let i = 0; i < 8; i++) {
			const cardsForCost: readonly DeckCard[] = groupedByCost['' + i] || [];
			cardsByCost.push({
				cost: i,
				label: i === 7 ? '7+' : i,
				quantity: cardsForCost.length,
			} as CardsByCost);
			this.maxQuantity = Math.max(this.maxQuantity, cardsForCost.length);
		}
		this.cardsByCost = cardsByCost;
	}

	cardsByCost: readonly CardsByCost[];
	maxQuantity = 0;

	constructor(private readonly deckHandler: DeckHandlerService) {}
}
