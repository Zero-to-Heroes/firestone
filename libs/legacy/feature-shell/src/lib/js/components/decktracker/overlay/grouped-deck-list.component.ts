import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { InternalDeckZoneSection } from '@components/decktracker/overlay/deck-list-by-zone.component';
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState } from '@firestone/game-state';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { DeckZone, DeckZoneSection } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { SetCard } from '../../../models/set';

// A set of cards for which the mana cost in reference cards is not what we want to show
const CARDS_FOR_WHICH_TO_SHOW_ORIGINAL_COST = [CardIds.ZilliaxDeluxe3000_TOY_330];

@Component({
	selector: 'grouped-deck-list',
	styleUrls: ['../../../../css/component/decktracker/overlay/grouped-deck-list.component.scss'],
	template: `
		<ul class="deck-list">
			<deck-zone
				*ngIf="zone$ | async as zone"
				[zone]="zone"
				[tooltipPosition]="_tooltipPosition"
				[colorManaCost]="colorManaCost"
				[showRelatedCards]="showRelatedCards"
				[showUnknownCards]="showUnknownCards"
				[showUpdatedCost]="showUpdatedCost"
				[showGiftsSeparately]="showGiftsSeparately$ | async"
				[groupSameCardsTogether]="groupSameCardsTogether$ | async"
				[showStatsChange]="showStatsChange"
				[showTopCardsSeparately]="showTopCardsSeparately$ | async"
				[showBottomCardsSeparately]="showBottomCardsSeparately$ | async"
				[side]="side"
				[showTotalCardsInZone]="showTotalCardsInZone"
				[collection]="collection"
				(cardClicked)="onCardClicked($event)"
			></deck-zone>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedDeckListComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Output() cardClicked: EventEmitter<VisualDeckCard> = new EventEmitter<VisualDeckCard>();

	zone$: Observable<DeckZone>;
	showTopCardsSeparately$: Observable<boolean>;
	showBottomCardsSeparately$: Observable<boolean>;
	showGiftsSeparately$: Observable<boolean>;
	groupSameCardsTogether$: Observable<boolean>;

	@Input() colorManaCost: boolean;
	@Input() showRelatedCards: boolean;
	@Input() showUnknownCards: boolean;
	@Input() showUpdatedCost: boolean;
	@Input() showStatsChange: boolean;
	@Input() showTotalCardsInZone: boolean;
	@Input() side: 'player' | 'opponent' | 'duels';
	@Input() collection: readonly SetCard[];

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		this._tooltipPosition = value;
	}

	@Input() set deckState(deckState: DeckState) {
		this.deckState$$.next(deckState);
		this.showWarning$$.next(deckState?.showDecklistWarning);
	}

	@Input() set cardsGoToBottom(value: boolean) {
		this.cardsGoToBottom$$.next(value);
	}

	@Input() set showBottomCardsSeparately(value: boolean) {
		this.showBottomCardsSeparately$$.next(value);
	}

	@Input() set showTopCardsSeparately(value: boolean) {
		this.showTopCardsSeparately$$.next(value);
	}

	@Input() set showGiftsSeparately(value: boolean) {
		this.showGiftsSeparately$$.next(value);
	}

	@Input() set groupSameCardsTogether(value: boolean) {
		this.groupSameCardsTogether$$.next(value);
	}

	@Input() set hideGeneratedCardsInOtherZone(value: boolean) {
		this.hideGeneratedCardsInOtherZone$$.next(value);
	}

	_tooltipPosition: CardTooltipPositionType;

	private deckState$$ = new BehaviorSubject<DeckState>(null);
	private showWarning$$ = new BehaviorSubject<boolean>(null);
	private cardsGoToBottom$$ = new BehaviorSubject<boolean>(false);
	private showBottomCardsSeparately$$ = new BehaviorSubject<boolean>(true);
	private showTopCardsSeparately$$ = new BehaviorSubject<boolean>(true);
	private showGiftsSeparately$$ = new BehaviorSubject<boolean>(true);
	private groupSameCardsTogether$$ = new BehaviorSubject<boolean>(false);
	private hideGeneratedCardsInOtherZone$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	ngAfterContentInit(): void {
		this.showTopCardsSeparately$ = this.showTopCardsSeparately$$.asObservable().pipe(this.mapData((info) => info));
		this.showBottomCardsSeparately$ = this.showBottomCardsSeparately$$
			.asObservable()
			.pipe(this.mapData((info) => info));
		this.showGiftsSeparately$ = this.showGiftsSeparately$$.asObservable().pipe(this.mapData((info) => info));
		this.groupSameCardsTogether$ = this.groupSameCardsTogether$$.asObservable().pipe(this.mapData((info) => info));
		this.zone$ = combineLatest([
			this.deckState$$.asObservable(),
			this.showWarning$$.asObservable(),
			this.cardsGoToBottom$$.asObservable(),
			this.hideGeneratedCardsInOtherZone$$.asObservable(),
			this.showTopCardsSeparately$,
			this.showBottomCardsSeparately$,
			this.showGiftsSeparately$,
			this.groupSameCardsTogether$,
		]).pipe(
			this.mapData(
				([
					deckState,
					showWarning,
					cardsGoToBottom,
					hideGeneratedCardsInOtherZone,
					showTopCardsSeparately,
					showBottomCardsSeparately,
					showGiftsSeparately,
					groupSameCardsTogether,
				]) =>
					this.buildGroupedList(
						deckState,
						showWarning,
						cardsGoToBottom,
						hideGeneratedCardsInOtherZone,
						showTopCardsSeparately,
						showBottomCardsSeparately,
						showGiftsSeparately,
						groupSameCardsTogether,
					),
			),
		);
	}

	onCardClicked(card: VisualDeckCard) {
		this.cardClicked.next(card);
	}

	private buildGroupedList(
		deckState: DeckState,
		showWarning: boolean,
		cardsGoToBottom: boolean,
		hideGeneratedCardsInOtherZone: boolean,
		showTopCardsSeparately: boolean,
		showBottomCardsSeparately: boolean,
		showGiftsSeparately: boolean,
		groupSameCardsTogether: boolean,
	) {
		if (!deckState) {
			return null;
		}

		const sortingFunction = (a: VisualDeckCard, b: VisualDeckCard) =>
			this.sortOrder(a, cardsGoToBottom, showGiftsSeparately) -
			this.sortOrder(b, cardsGoToBottom, showGiftsSeparately);

		const deckSections: InternalDeckZoneSection[] = [];
		let cardsInDeckZone = deckState.deck;
		if (showTopCardsSeparately && cardsInDeckZone.filter((c) => c.positionFromTop != undefined).length) {
			deckSections.push({
				header: this.i18n.translateString('decktracker.zones.top-of-deck'),
				sortingFunction: (a, b) => a.positionFromTop - b.positionFromTop,
				cards: cardsInDeckZone.filter((c) => c.positionFromTop != undefined),
				order: -1,
			});
			cardsInDeckZone = cardsInDeckZone.filter((c) => c.positionFromTop == undefined);
		}
		if (showBottomCardsSeparately && cardsInDeckZone.filter((c) => c.positionFromBottom != undefined).length) {
			deckSections.push({
				header: this.i18n.translateString('decktracker.zones.bottom-of-deck'),
				sortingFunction: (a, b) => a.positionFromBottom - b.positionFromBottom,
				cards: cardsInDeckZone.filter((c) => c.positionFromBottom != undefined),
				order: 1,
			});
			cardsInDeckZone = cardsInDeckZone.filter((c) => c.positionFromBottom == undefined);
		}

		const deckForBase: DeckState = deckState.update({
			deck: cardsInDeckZone,
		});
		const base = this.buildBaseCards(deckForBase, hideGeneratedCardsInOtherZone);
		deckSections.push({
			header: deckSections.length == 0 ? null : this.i18n.translateString('decktracker.zones.in-deck'),
			cards: base,
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
		return {
			id: 'single-zone',
			name: undefined,
			numberOfCards: base.length,
			showWarning: showWarning,
			sections: sections,
		};
	}

	private buildBaseCards(deckState: DeckState, hideGeneratedCardsInOtherZone: boolean): readonly VisualDeckCard[] {
		const mode = !!deckState.deckList?.length ? 'focus-decklist' : 'show-played';
		const baseCards: readonly VisualDeckCard[] =
			mode === 'focus-decklist'
				? this.buildBaseCardForFocus(deckState, hideGeneratedCardsInOtherZone)
				: this.buildBaseCardsForShowPlayed(deckState, hideGeneratedCardsInOtherZone);
		return baseCards.map((c) => {
			return VisualDeckCard.create({
				...c,
				mainAttributeChange: null, // FIXME
			});
		});
	}

	private buildBaseCardForFocus(
		deckState: DeckState,
		hideGeneratedCardsInOtherZone: boolean,
	): readonly VisualDeckCard[] {
		const deck: readonly DeckCard[] = deckState.deck;
		// Here we should get all the cards that were part of the initial deck (+ the generated cards,
		// if the option is enabled)
		const cardsToShowNotInDeck = [
			...deckState.hand
				.filter((c) => !c.creatorCardId)
				// Remove "unknown cards"
				.filter((c) => !!c.cardId),
			...deckState.board.filter((c) => !hideGeneratedCardsInOtherZone || !c.creatorCardId),
			...deckState.otherZone
				.filter((c) => !!c.cardId)
				.filter((c) => this.allCards.getCard(c.cardId).type !== 'Enchantment')
				.filter((c) => !hideGeneratedCardsInOtherZone || !c.creatorCardId)
				// Cards that get discovered as sometimes marked as "temporary cards". Sometimes the game creates copies, sometimes
				// not. There might be a way to make sure we know what is what (based on the linkedEntityId), but I need to investigate
				// that
				// How to handle discarded cards? They should probably be handled in the same way as cards played in the "other" zone
				.filter((c) => c.zone !== 'SETASIDE' || !c.temporaryCard),
		];
		const cardsToShow = [
			...deck
				// Remove "unknown cards"
				.filter((c) => !!c.cardId || !!c.creatorCardId),
			...cardsToShowNotInDeck,
		];
		const uniqueCardNames = [...new Set(cardsToShow.map((c) => c.cardName))];
		const result = uniqueCardNames
			.flatMap((cardName) => {
				const matchingCards = cardsToShow.filter((c) => c.cardName === cardName);
				const refCard = matchingCards.find((c) => c.cardName === cardName);
				const cardsToShowWithName = cardsToShow.filter((c) => c.cardName === cardName);
				const isInInitialDecklist = !!deckState.deckList.find((c) => c.cardName === cardName);
				const quantityInDeck = deck.filter((c) => c.cardName === cardName).length;
				const creatorCardIds = cardsToShowWithName.map((c) => c.creatorCardId).filter((id) => !!id);
				const shouldShowGiftLine = !hideGeneratedCardsInOtherZone && !!creatorCardIds.length;
				const shouldShowDeckLine = isInInitialDecklist || quantityInDeck > 0;
				const result: VisualDeckCard[] = [];

				if (shouldShowDeckLine) {
					const displayMode = !quantityInDeck ? 'dim' : null;
					result.push(
						...Array(Math.max(1, quantityInDeck)).fill(
							VisualDeckCard.create({
								...refCard,
								// Always show the base cost in this display mode
								manaCost: this.allCards.getCard(refCard.cardId).hideStats
									? null
									: this.getManaCost(refCard),
								actualManaCost: this.getManaCost(refCard),
								// Don't show a gift icon when the card is in the deck
								creatorCardIds: [],
								highlight: displayMode,
								internalEntityIds: matchingCards.map((c) => c.internalEntityId),
							}),
						),
					);
				}
				if (shouldShowGiftLine) {
					const otherCreatorCardIds = cardsToShowNotInDeck
						.filter((c) => c.cardName === cardName)
						.map((c) => c.creatorCardId)
						.filter((id) => !!id);
					const quantityNotInDeck = cardsToShowNotInDeck
						.filter((c) => !!c.creatorCardId)
						.filter((c) => c.cardName === cardName).length;
					result.push(
						...Array(quantityNotInDeck).fill(
							VisualDeckCard.create({
								...refCard,
								manaCost: this.allCards.getCard(refCard.cardId).hideStats
									? null
									: this.getManaCost(refCard),
								actualManaCost: this.getManaCost(refCard),
								creatorCardIds: otherCreatorCardIds,
								highlight: 'dim',
								internalEntityIds: matchingCards.map((c) => c.internalEntityId),
							}),
						),
					);
				}
				return result;
			})
			.sort(sortByProperties((a: VisualDeckCard) => [a.manaCost]));
		return result;
	}

	private buildBaseCardsForShowPlayed(
		deckState: DeckState,
		hideGeneratedCardsInOtherZone: boolean,
	): readonly VisualDeckCard[] {
		const deck: readonly DeckCard[] = deckState.deck;
		// Here we should get all the cards that were part of the initial deck (+ the generated cards,
		// if the option is enabled)
		const cardsToShowNotInDeck = [
			...deckState.hand
				.filter((c) => !c.creatorCardId)
				// Remove "unknown cards"
				.filter((c) => !!c.cardId),
			...deckState.board.filter((c) => !hideGeneratedCardsInOtherZone || !c.creatorCardId),
			...deckState.otherZone
				.filter((c) => !!c.cardId)
				.filter((c) => this.allCards.getCard(c.cardId).type !== 'Enchantment')
				.filter((c) => !hideGeneratedCardsInOtherZone || !c.creatorCardId)
				// Cards that get discovered as sometimes marked as "temporary cards". Sometimes the game creates copies, sometimes
				// not. There might be a way to make sure we know what is what (based on the linkedEntityId), but I need to investigate
				// that
				// How to handle discarded cards? They should probably be handled in the same way as cards played in the "other" zone
				.filter((c) => c.zone !== 'SETASIDE' || !c.temporaryCard),
		];
		const cardsToShow = [
			...deck
				// Remove "unknown cards"
				.filter((c) => !!c.cardId || !!c.creatorCardId),
			...cardsToShowNotInDeck,
		];
		const uniqueCardNames = [...new Set(cardsToShow.map((c) => c.cardName))];
		const result = uniqueCardNames
			.flatMap((cardName) => {
				const matchingCards = cardsToShow.filter((c) => c.cardName === cardName);
				const refCard = matchingCards.find((c) => c.cardName === cardName);
				const cardsToShowWithName = cardsToShow.filter((c) => c.cardName === cardName);
				const quantityInDeck = deck.filter((c) => c.cardName === cardName).length;
				const shouldShowDeckLine =
					!!cardsToShowWithName.filter((c) => !c?.creatorCardId).length || quantityInDeck > 0;
				// Gift line in the deck is shown as a card in deck
				const shouldShowGiftLine =
					!hideGeneratedCardsInOtherZone &&
					!!cardsToShowNotInDeck
						.filter((c) => c.cardName === cardName)
						.map((c) => c.creatorCardId)
						.filter((id) => !!id).length;
				const result: VisualDeckCard[] = [];

				if (shouldShowDeckLine) {
					// Show the cards that we know to still be in deck
					if (quantityInDeck > 0) {
						result.push(
							...Array(quantityInDeck).fill(
								VisualDeckCard.create({
									...refCard,
									// Always show the base cost in this display mode
									manaCost: this.getManaCost(refCard),
									actualManaCost: this.getManaCost(refCard),
									creatorCardIds: [],
									highlight: null,
									internalEntityIds: matchingCards.map((c) => c.internalEntityId),
								}),
							),
						);
					}
					// Show the cards that were played
					const quantityNotInDeck = cardsToShowNotInDeck
						.filter((c) => c.cardName === cardName)
						.filter((c) => !c.creatorCardId).length;
					if (quantityNotInDeck > 0) {
						result.push(
							...Array(quantityNotInDeck).fill(
								VisualDeckCard.create({
									...refCard,
									// Always show the base cost in this display mode
									manaCost: this.allCards.getCard(refCard.cardId).hideStats
										? null
										: this.getManaCost(refCard),
									actualManaCost: this.getManaCost(refCard),
									highlight: 'dim',
									internalEntityIds: matchingCards.map((c) => c.internalEntityId),
								}),
							),
						);
					}
				}
				if (shouldShowGiftLine) {
					const otherCreatorCardIds = cardsToShowNotInDeck
						.filter((c) => c.cardName === cardName)
						.map((c) => c.creatorCardId)
						.filter((id) => !!id);
					const quantityNotInDeck = cardsToShowNotInDeck
						.filter((c) => !!c.creatorCardId)
						.filter((c) => c.cardName === cardName).length;
					result.push(
						...Array(quantityNotInDeck).fill(
							VisualDeckCard.create({
								...refCard,
								manaCost: this.allCards.getCard(refCard.cardId).hideStats
									? null
									: this.getManaCost(refCard),
								actualManaCost: this.getManaCost(refCard),
								creatorCardIds: otherCreatorCardIds,
								highlight: 'dim',
								internalEntityIds: matchingCards.map((c) => c.internalEntityId),
							}),
						),
					);
				}
				return result;
			})
			.sort(sortByProperties((a: VisualDeckCard) => [a.manaCost]));
		return result;
	}

	private getManaCost(refCard: DeckCard): number {
		if (CARDS_FOR_WHICH_TO_SHOW_ORIGINAL_COST.some((c) => refCard.cardId?.startsWith(c))) {
			return refCard.manaCost;
		}
		return this.allCards.getCard(refCard.cardId).cost ?? refCard.manaCost;
	}

	private sortOrder(card: VisualDeckCard, cardsGoToBottom: boolean, showGiftsSeparately: boolean): number {
		const isGift = !!card.creatorCardId?.length || !!card.creatorCardIds?.length;
		// if (showGiftsSeparately && isGift) {
		// 	return 4;
		// }

		// Generated cards always go to the bottom
		// if (cardsGoToBottom && isGift) {
		// 	return 3;
		// }

		if (cardsGoToBottom) {
			switch (card.highlight) {
				case 'normal':
					return 0;
				// case 'in-hand':
				// 	return 1;
				case 'dim':
					return 2;
				default:
					return 0;
			}
		}

		// Gifts (that are not in the deck) always appear at the bottom of the deck, so as not to be confused
		// with cards actually in the deck, or part of the initial decklist
		if (isGift && card.highlight === 'dim') {
			return 3;
		}
		return 0;
	}
}
