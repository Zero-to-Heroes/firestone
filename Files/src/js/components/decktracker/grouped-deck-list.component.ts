import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { DeckState } from '../../models/decktracker/deck-state';
import { DeckZone } from '../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../models/decktracker/visual-deck-card';

@Component({
	selector: 'grouped-deck-list',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/grouped-deck-list.component.scss',
	],
	template: `
		<ul class="deck-list">
			<deck-zone [zone]="zone" [activeTooltip]="activeTooltip"></deck-zone>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedDeckListComponent {

	@Input() activeTooltip: string;
	zone: DeckZone;

	@Input('deckState') set deckState(deckState: DeckState) {
		// The zone in this view is the decklist + cards in the deck that didn't 
		// start in the decklist
		// The way we want to display it:
		// - If the card is in hand: special highlight (if there are some copies in deck as well, just use the number)
		// - If the card is in the deck: normal highlight
		// - If the card is neither in deck nor in hand: dim
		const base = deckState.deckList.map((card) => ({
			cardId: card.cardId,
			cardName: card.cardName,
			manaCost: card.manaCost,
			rarity: card.rarity,
			totalQuantity: 0,
			highlight: undefined,
		} as VisualDeckCard));
		const baseWithQuantities = base
				.map((card) => {
					let quantity = 0;
					let highlight = 'dim';
					const deckCard = deckState.deck.find((c) => c.cardId === card.cardId);
					if (deckCard) {
						quantity = deckCard.totalQuantity;
						highlight = 'normal';
					}
					const handCard = deckState.hand.find((c) => c.cardId === card.cardId);
					if (handCard) {
						// quantity += handCard.totalQuantity; // We only show the number of cards left in deck
						highlight = 'normal';
					}
					let newCard = Object.assign(new VisualDeckCard(), card, {
						totalQuantity: quantity,
						highlight: highlight,
					} as VisualDeckCard);
					return newCard;
				});
		const cardsInDeckNotInDecklist = deckState.deck
				.filter((card) => !deckState.deckList.find((c) => c.cardId === card.cardId))
				.map((card) => ({
					cardId: card.cardId,
					cardName: card.cardName,
					manaCost: card.manaCost,
					rarity: card.rarity,
					totalQuantity: card.totalQuantity,
					highlight: 'normal',
				} as VisualDeckCard));
		this.zone = {
			id: 'single-zone',
			name: undefined,
			cards: [...baseWithQuantities, ...cardsInDeckNotInDecklist],
			sortingFunction: (a, b) => a.manaCost - b.manaCost,
		} as DeckZone;
	}
}