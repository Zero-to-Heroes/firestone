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
			<deck-zone
				*ngIf="zone"
				[zone]="zone"
				[tooltipPosition]="_tooltipPosition"
				[colorManaCost]="colorManaCost"
				[showGiftsSeparately]="showGiftsSeparately"
			></deck-zone>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedDeckListComponent {
	@Input() colorManaCost: boolean;
	@Input() showGiftsSeparately: boolean;
	_tooltipPosition: CardTooltipPositionType;
	zone: DeckZone;

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		// console.log('[grouped-deck-list] setting tooltip position', value);
		this._tooltipPosition = value;
	}

	// private deckList: readonly DeckCard[];
	// private hand: readonly DeckCard[];
	private _deckState: DeckState;
	private _cardsGoToBottom: boolean;
	private showWarning: boolean;

	@Input('deckState') set deckState(deckState: DeckState) {
		this._deckState = deckState;
		this.showWarning = deckState.showDecklistWarning;
		// console.log('setting deck state', deckState, this.deck);
		this.buildGroupedList();
	}

	@Input() set cardsGoToBottom(value: boolean) {
		this._cardsGoToBottom = value;
		this.buildGroupedList();
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}

	private buildGroupedList() {
		// When we don't have the decklist, we just show all the cards in hand + deck
		const knownDeck = this._deckState.deck;
		const hand = this._deckState.hand;
		const board = this._deckState.board;
		const other = this._deckState.otherZone.filter(card => card.zone !== 'SETASIDE');
		const deckList = this._deckState.deckList || [];
		const deck =
			deckList.length > 0
				? knownDeck
				: [...knownDeck, ...hand, ...board, ...other].sort((a, b) => a.manaCost - b.manaCost);
		// console.log('grouping deck list?', knownDeck, deck, this._deckState);
		// The zone in this view is the decklist + cards in the deck that didn't
		// start in the decklist
		const groupedFromDecklist: Map<string, DeckCard[]> = this.groupBy(deckList, (card: DeckCard) => card.cardId);
		const groupedFromDeck: Map<string, DeckCard[]> = this.groupBy(deck, (card: DeckCard) => card.cardId);
		const groupedFromNotInBaseDeck: Map<string, DeckCard[]> = this.groupBy(
			deck.filter(card => !deckList.find(c => c.cardId === card.cardId)),
			(card: DeckCard) => card.cardId,
		);
		const base = [];
		for (const cardId of Array.from(groupedFromDecklist.keys())) {
			const cardsInDeck = (groupedFromDeck.get(cardId) || []).length;
			const isAtLeastOneCardInHand = (hand || []).filter(card => card.cardId === cardId).length > 0;
			// console.log('at least one in hand?', isAtLeastOneCardInHand, cardId, hand);
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
					highlight: isAtLeastOneCardInHand ? 'in-hand' : 'normal',
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
					highlight: isAtLeastOneCardInHand ? 'in-hand' : 'dim',
				} as VisualDeckCard);
				// console.log('base is now', base);
			}
		}
		for (const cardId of Array.from(groupedFromNotInBaseDeck.keys())) {
			const cardsInDeck = (groupedFromDeck.get(cardId) || []).length;
			const isAtLeastOneCardInHand = (hand || []).filter(card => card.cardId === cardId).length > 0;
			const isInOtherZone =
				[...(board || []), ...(other || [])].filter(card => card.cardId === cardId).length > 0;
			const isInBaseDeck = (knownDeck || []).filter(card => card.cardId === cardId).length > 0;
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
					highlight: isAtLeastOneCardInHand ? 'in-hand' : !isInBaseDeck && isInOtherZone ? 'dim' : 'normal',
					creatorCardIds: creatorCardIds,
				} as VisualDeckCard);
				// console.log('base is now', base);
			}
		}
		const sortingFunction = this._cardsGoToBottom
			? (a: VisualDeckCard, b: VisualDeckCard) => this.sortOrder(a) - this.sortOrder(b) || a.manaCost - b.manaCost
			: (a: VisualDeckCard, b: VisualDeckCard) => a.manaCost - b.manaCost;
		this.zone = {
			id: 'single-zone',
			name: undefined,
			cards: base,
			sortingFunction: sortingFunction,
			numberOfCards: base.length,
			showWarning: this.showWarning,
		} as DeckZone;
		// console.log('setting final zone', this.zone);
		// if (!(this.cdr as ViewRef).destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	private sortOrder(card: VisualDeckCard): number {
		switch (card.highlight) {
			case 'normal':
				return 0;
			case 'in-hand':
				return 1;
			case 'dim':
				return 2;
			default:
				return 3;
		}
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
