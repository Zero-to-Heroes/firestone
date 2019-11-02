import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
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
			<deck-zone *ngIf="zone" [zone]="zone" [tooltipPosition]="_tooltipPosition"></deck-zone>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedDeckListComponent {
	_tooltipPosition: CardTooltipPositionType;
	zone: DeckZone;

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		// console.log('[grouped-deck-list] setting tooltip position', value);
		this._tooltipPosition = value;
	}

	private deckList: readonly DeckCard[];
	private deck: readonly DeckCard[];
	private hand: readonly DeckCard[];
	private _deckState: DeckState;
	private _highlight: boolean;

	@Input('deckState') set deckState(deckState: DeckState) {
		this._deckState = deckState;
		// console.log('setting deck state', deckState, this.deck);
		this.buildGroupedList();
	}

	@Input() set highlightCardsInHand(value: boolean) {
		this._highlight = value;
		// console.log('setting highlightCardsInHand', value);
		this.buildGroupedList();
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}

	private buildGroupedList() {
		// When we don't have the decklist, we just show all the cards in hand + deck
		this.hand = this._deckState.hand;
		this.deckList = this._deckState.deckList || [];
		this.deck =
			this.deckList.length > 0
				? this._deckState.deck
				: [...this._deckState.deck, ...this._deckState.hand, ...this._deckState.otherZone].sort(
						(a, b) => a.manaCost - b.manaCost,
				  );
		// console.log('grouping deck list?', this._deckState.deckList, this.deck, this._deckState);
		// The zone in this view is the decklist + cards in the deck that didn't
		// start in the decklist
		const groupedFromDecklist: Map<string, DeckCard[]> = this.groupBy(
			this.deckList,
			(card: DeckCard) => card.cardId,
		);
		const groupedFromDeck: Map<string, DeckCard[]> = this.groupBy(this.deck, (card: DeckCard) => card.cardId);
		const groupedFromNotInBaseDeck: Map<string, DeckCard[]> = this.groupBy(
			this.deck.filter(card => !this.deckList.find(c => c.cardId === card.cardId)),
			(card: DeckCard) => card.cardId,
		);
		const base = [];
		for (const cardId of Array.from(groupedFromDecklist.keys())) {
			const cardsInDeck = (groupedFromDeck.get(cardId) || []).length;
			const isAtLeastOneCardInHand = (this.hand || []).filter(card => card.cardId === cardId).length > 0;
			const creatorCardIds: readonly string[] = (groupedFromDeck.get(cardId) || [])
				.map(card => card.creatorCardId)
				.filter(creator => creator);
			// console.log('cardId from in declikst', cardId, cardsInDeck, creatorCardIds, groupedFromDeck.get(cardId));
			for (let i = 0; i < cardsInDeck; i++) {
				// console.log('pushing');
				base.push({
					cardId: groupedFromDecklist.get(cardId)[0].cardId,
					cardName: groupedFromDecklist.get(cardId)[0].cardName,
					manaCost: groupedFromDecklist.get(cardId)[0].manaCost,
					rarity: groupedFromDecklist.get(cardId)[0].rarity,
					highlight: isAtLeastOneCardInHand && this._highlight ? 'in-hand' : 'normal',
					creatorCardIds: creatorCardIds,
				} as VisualDeckCard);
				// console.log('base is now', base);
			}
			if (cardsInDeck === 0) {
				// console.log('pushing dim version');
				base.push({
					cardId: groupedFromDecklist.get(cardId)[0].cardId,
					cardName: groupedFromDecklist.get(cardId)[0].cardName,
					manaCost: groupedFromDecklist.get(cardId)[0].manaCost,
					rarity: groupedFromDecklist.get(cardId)[0].rarity,
					highlight: isAtLeastOneCardInHand && this._highlight ? 'in-hand' : 'dim',
				} as VisualDeckCard);
				// console.log('base is now', base);
			}
		}
		for (const cardId of Array.from(groupedFromNotInBaseDeck.keys())) {
			const cardsInDeck = (groupedFromDeck.get(cardId) || []).length;
			const isAtLeastOneCardInHand = (this.hand || []).filter(card => card.cardId === cardId).length > 0;
			const creatorCardIds: readonly string[] = (groupedFromDeck.get(cardId) || [])
				.map(card => card.creatorCardId)
				.filter(creator => creator);
			// console.log('cardId from not in deck', cardId, cardsInDeck, creatorCardIds);
			for (let i = 0; i < cardsInDeck; i++) {
				// console.log('pushing');
				base.push({
					cardId: groupedFromDeck.get(cardId)[i].cardId,
					cardName: groupedFromDeck.get(cardId)[i].cardName,
					manaCost: groupedFromDeck.get(cardId)[i].manaCost,
					rarity: groupedFromDeck.get(cardId)[i].rarity,
					highlight: isAtLeastOneCardInHand && this._highlight ? 'in-hand' : 'normal',
					creatorCardIds: creatorCardIds,
				} as VisualDeckCard);
				// console.log('base is now', base);
			}
		}
		this.zone = {
			id: 'single-zone',
			name: undefined,
			cards: base,
			sortingFunction: (a, b) => a.manaCost - b.manaCost,
		} as DeckZone;
		// console.log('setting final zone', this.zone);
		// if (!(this.cdr as ViewRef).destroyed) {
		// 	this.cdr.detectChanges();
		// }
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
