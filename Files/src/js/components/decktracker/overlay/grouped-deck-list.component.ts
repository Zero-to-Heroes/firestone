import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';

@Component({
	selector: 'grouped-deck-list',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/grouped-deck-list.component.scss',
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
		// When we don't have the decklist, we just show all the cards in hand + deck
		const deckList = deckState.deckList || [];
		const deck =
			deckList.length > 0
				? deckState.deck
				: [...deckState.deck, ...deckState.hand, ...deckState.otherZone].sort(
						(a, b) => a.manaCost - b.manaCost,
				  );
		// console.log('grouping deck list?', deckState.deckList, deck, deckState);
		// The zone in this view is the decklist + cards in the deck that didn't
		// start in the decklist
		const groupedFromDecklist: Map<string, DeckCard[]> = this.groupBy(deckList, (card: DeckCard) => card.cardId);
		const groupedFromDeck: Map<string, DeckCard[]> = this.groupBy(deck, (card: DeckCard) => card.cardId);
		const groupedFromNotInBaseDeck: Map<string, DeckCard[]> = this.groupBy(
			deck.filter(card => !deckList.find(c => c.cardId === card.cardId)),
			(card: DeckCard) => card.cardId,
		);

		// console.log('grouping done', groupedFromDecklist, groupedFromDeck, groupedFromNotInBaseDeck);
		const base = [];
		for (const cardId of Array.from(groupedFromDecklist.keys())) {
			const cardsInDeck = (groupedFromDeck.get(cardId) || []).length;
			for (let i = 0; i < cardsInDeck; i++) {
				base.push({
					cardId: groupedFromDecklist.get(cardId)[0].cardId,
					cardName: groupedFromDecklist.get(cardId)[0].cardName,
					manaCost: groupedFromDecklist.get(cardId)[0].manaCost,
					rarity: groupedFromDecklist.get(cardId)[0].rarity,
					highlight: 'normal',
				} as VisualDeckCard);
			}
			if (cardsInDeck === 0) {
				base.push({
					cardId: groupedFromDecklist.get(cardId)[0].cardId,
					cardName: groupedFromDecklist.get(cardId)[0].cardName,
					manaCost: groupedFromDecklist.get(cardId)[0].manaCost,
					rarity: groupedFromDecklist.get(cardId)[0].rarity,
					highlight: 'dim',
				} as VisualDeckCard);
			}
		}
		for (const cardId of Array.from(groupedFromNotInBaseDeck.keys())) {
			const cardsInDeck = (groupedFromDeck.get(cardId) || []).length;
			for (let i = 0; i < cardsInDeck; i++) {
				base.push({
					cardId: groupedFromDeck.get(cardId)[i].cardId,
					cardName: groupedFromDeck.get(cardId)[i].cardName,
					manaCost: groupedFromDeck.get(cardId)[i].manaCost,
					rarity: groupedFromDeck.get(cardId)[i].rarity,
					highlight: 'normal',
				} as VisualDeckCard);
			}
		}
		this.zone = {
			id: 'single-zone',
			name: undefined,
			cards: base,
			sortingFunction: (a, b) => a.manaCost - b.manaCost,
		} as DeckZone;
	}

	private groupBy(list, keyGetter): Map<string, DeckCard[]> {
		const map = new Map();
		list.forEach(item => {
			const key = keyGetter(item);
			const collection = map.get(key);
			if (!collection) {
				map.set(key, [item]);
			} else {
				collection.push(item);
			}
		});
		return map;
	}
}
