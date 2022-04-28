import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Output,
} from '@angular/core';
import { InternalDeckZoneSection } from '@components/decktracker/overlay/deck-list-by-zone.component';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckZone, DeckZoneSection } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { SetCard } from '../../../models/set';

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
				[showUnknownCards]="showUnknownCards"
				[showUpdatedCost]="showUpdatedCost"
				[showGiftsSeparately]="showGiftsSeparately"
				[showStatsChange]="showStatsChange"
				[showTopCardsSeparately]="_showTopCardsSeparately"
				[showBottomCardsSeparately]="_showBottomCardsSeparately"
				[side]="side"
				[collection]="collection"
				(cardClicked)="onCardClicked($event)"
			></deck-zone>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedDeckListComponent implements OnDestroy {
	@Output() cardClicked: EventEmitter<VisualDeckCard> = new EventEmitter<VisualDeckCard>();

	@Input() colorManaCost: boolean;
	@Input() showUnknownCards: boolean;
	@Input() showUpdatedCost: boolean;
	@Input() showGiftsSeparately: boolean;
	@Input() showStatsChange: boolean;
	@Input() side: 'player' | 'opponent';
	@Input() collection: readonly SetCard[];

	_tooltipPosition: CardTooltipPositionType;
	zone: DeckZone;

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		this._tooltipPosition = value;
	}

	// private deckList: readonly DeckCard[];
	// private hand: readonly DeckCard[];
	private _deckState: DeckState;
	private _cardsGoToBottom: boolean;
	private _darkenUsedCards: boolean;
	private _showCardsInHand = false;
	private _showBottomCardsSeparately = true;
	private _showTopCardsSeparately = true;
	private showWarning: boolean;

	@Input('deckState') set deckState(deckState: DeckState) {
		this._deckState = deckState;
		this.showWarning = deckState?.showDecklistWarning;

		this.buildGroupedList();
	}

	@Input() set cardsGoToBottom(value: boolean) {
		this._cardsGoToBottom = value;
		this.buildGroupedList();
	}

	@Input() set darkenUsedCards(value: boolean) {
		this._darkenUsedCards = value;
		this.buildGroupedList();
	}

	@Input() set showBottomCardsSeparately(value: boolean) {
		if (value === this._showBottomCardsSeparately) {
			return;
		}
		this._showBottomCardsSeparately = value;
		this.buildGroupedList();
	}

	@Input() set showTopCardsSeparately(value: boolean) {
		if (value === this._showTopCardsSeparately) {
			return;
		}
		this._showTopCardsSeparately = value;
		this.buildGroupedList();
	}

	constructor(private readonly i18n: LocalizationFacadeService) {}

	@HostListener('window:beforeunload')
	ngOnDestroy(): void {
		this.zone = null;
		this._deckState = null;
	}

	onCardClicked(card: VisualDeckCard) {
		this.cardClicked.next(card);
	}

	private buildGroupedList() {
		if (!this._deckState) {
			return;
		}
		// When we don't have the decklist, we just show all the cards in hand + deck
		const knownDeck = this._deckState.deck;
		const hand = this._deckState.hand;
		const board = this._deckState.board;
		const other = this._deckState.otherZone.filter((card) => card.zone !== 'SETASIDE');
		const deckList = this._deckState.deckList || [];
		const deck =
			deckList.length > 0
				? knownDeck
				: [...knownDeck, ...hand, ...board, ...other].sort((a, b) => a.manaCost - b.manaCost);
		// The zone in this view is the decklist + cards in the deck that didn't
		// start in the decklist
		const groupedFromDecklist: Map<string, DeckCard[]> = this.groupBy(deckList, (card: DeckCard) => card.cardId);
		const groupedFromDeck: Map<string, DeckCard[]> = this.groupBy(deck, (card: DeckCard) => card.cardId);
		const groupedFromNotInBaseDeck: Map<string, DeckCard[]> = this.groupBy(
			deck.filter((card) => !deckList.find((c) => c.cardId === card.cardId)),
			(card: DeckCard) => card.cardId,
		);
		const base: VisualDeckCard[] = [];
		for (const cardId of Array.from(groupedFromDecklist.keys())) {
			const cardsInDeck = (groupedFromDeck.get(cardId) || []).length;
			const creatorCardIds: readonly string[] = (groupedFromDeck.get(cardId) || [])
				.map((card) => card.creatorCardId)
				.filter((creator) => creator);
			if (!groupedFromDecklist.get(cardId)?.length) {
				console.warn('no entries in grouped deck list', cardId, groupedFromDecklist.get(cardId));
				continue;
			}
			for (let i = 0; i < cardsInDeck; i++) {
				base.push(
					// Not sure why initially the card is created from the decklist instead of the deck, since the
					// card in deck has more information (like the base attribute update field)
					VisualDeckCard.create({
						...(groupedFromDeck.get(cardId)[i] ??
							groupedFromDeck.get(cardId)[0] ??
							groupedFromDecklist.get(cardId)[0]),
						highlight: 'normal',
						creatorCardIds: creatorCardIds,
					} as VisualDeckCard),
				);
			}
			if (cardsInDeck === 0) {
				base.push(
					VisualDeckCard.create({
						...groupedFromDecklist.get(cardId)[0],
						highlight: this._darkenUsedCards ? 'dim' : 'normal',
					} as VisualDeckCard),
				);
			}
		}
		for (const cardId of Array.from(groupedFromNotInBaseDeck.keys())) {
			const cardsInDeck = (groupedFromDeck.get(cardId) || []).length;
			const isInOtherZone =
				[...(board || []), ...(other || [])].filter((card) => card.cardId === cardId).length > 0;
			const isInBaseDeck = (knownDeck || []).filter((card) => card.cardId === cardId).length > 0;
			const creatorCardIds: readonly string[] = (groupedFromDeck.get(cardId) || [])
				.map((card) => card.creatorCardId)
				.filter((creator) => creator);
			if (!groupedFromDeck.get(cardId)?.length) {
				console.warn('no entries in grouped deck list 2', cardId, groupedFromDeck.get(cardId));
				continue;
			}
			for (let i = 0; i < cardsInDeck; i++) {
				base.push(
					VisualDeckCard.create({
						...groupedFromDeck.get(cardId)[i],
						highlight: !isInBaseDeck && this._darkenUsedCards && isInOtherZone ? 'dim' : 'normal',
						creatorCardIds: creatorCardIds,
					} as VisualDeckCard),
				);
			}
		}
		const sortingFunction = this._cardsGoToBottom
			? (a: VisualDeckCard, b: VisualDeckCard) => this.sortOrder(a) - this.sortOrder(b) || a.manaCost - b.manaCost
			: null;

		const deckSections: InternalDeckZoneSection[] = [];
		let cardsInDeckZone = base;
		if (this._showTopCardsSeparately && base.filter((c) => c.positionFromTop != undefined).length) {
			deckSections.push({
				header: this.i18n.translateString('decktracker.zones.top-of-deck'),
				sortingFunction: (a, b) => a.positionFromTop - b.positionFromTop,
				cards: base.filter((c) => c.positionFromTop != undefined),
				order: -1,
			});
			cardsInDeckZone = cardsInDeckZone.filter((c) => c.positionFromTop == undefined);
		}
		if (this._showBottomCardsSeparately && base.filter((c) => c.positionFromBottom != undefined).length) {
			deckSections.push({
				header: this.i18n.translateString('decktracker.zones.bottom-of-deck'),
				sortingFunction: (a, b) => a.positionFromBottom - b.positionFromBottom,
				cards: base.filter((c) => c.positionFromBottom != undefined),
				order: 1,
			});
			cardsInDeckZone = cardsInDeckZone.filter((c) => c.positionFromBottom == undefined);
		}
		deckSections.push({
			header: deckSections.length == 0 ? null : this.i18n.translateString('decktracker.zones.in-deck'),
			cards: cardsInDeckZone,
			sortingFunction: sortingFunction,
			order: 0,
		});
		const sections: readonly DeckZoneSection[] = deckSections
			.sort((a, b) => a.order - b.order)
			.map(
				(zone) =>
					({
						header: zone.header,
						cards: zone.cards,
						sortingFunction: zone.sortingFunction,
					} as DeckZoneSection),
			);
		this.zone = {
			id: 'single-zone',
			name: undefined,
			numberOfCards: base.length,
			showWarning: this.showWarning,
			sections: sections,
		};
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
		list.forEach((item) => {
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
