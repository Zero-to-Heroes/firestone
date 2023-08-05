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
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckZone, DeckZoneSection } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { SetCard } from '../../../models/set';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

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
export class GroupedDeckListComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	@Output() cardClicked: EventEmitter<VisualDeckCard> = new EventEmitter<VisualDeckCard>();

	zone$: Observable<DeckZone>;
	showTopCardsSeparately$: Observable<boolean>;
	showBottomCardsSeparately$: Observable<boolean>;
	showGiftsSeparately$: Observable<boolean>;

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
	private hideGeneratedCardsInOtherZone$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.showTopCardsSeparately$ = this.showTopCardsSeparately$$.asObservable().pipe(this.mapData((info) => info));
		this.showBottomCardsSeparately$ = this.showBottomCardsSeparately$$
			.asObservable()
			.pipe(this.mapData((info) => info));
		this.showGiftsSeparately$ = this.showGiftsSeparately$$.asObservable().pipe(this.mapData((info) => info));
		this.zone$ = combineLatest([
			this.deckState$$.asObservable(),
			this.showWarning$$.asObservable(),
			this.cardsGoToBottom$$.asObservable(),
			this.hideGeneratedCardsInOtherZone$$.asObservable(),
			this.showTopCardsSeparately$,
			this.showBottomCardsSeparately$,
			this.showGiftsSeparately$,
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
				]) =>
					this.buildGroupedList(
						deckState,
						showWarning,
						cardsGoToBottom,
						hideGeneratedCardsInOtherZone,
						showTopCardsSeparately,
						showBottomCardsSeparately,
						showGiftsSeparately,
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
	) {
		// console.debug('building zone', deckState);
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

		const base = this.buildBaseCards(deckState, hideGeneratedCardsInOtherZone);
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
		//console.debug('zone', sections);
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
		// console.debug('base cards', mode, baseCards[0]?.cardName, baseCards, deckState);
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
		// console.debug('cardsToShowNotInDeck', cardsToShowNotInDeck);
		const cardsToShow = [
			...deck
				// Remove "unknown cards"
				.filter((c) => !!c.cardId || !!c.creatorCardId),
			...cardsToShowNotInDeck,
		];
		// console.debug('cardsToShow', cardsToShow);
		const uniqueCardNames = [...new Set(cardsToShow.map((c) => c.cardName))];
		// console.debug('uniqueCardNames', uniqueCardNames);
		const result = uniqueCardNames
			.flatMap((cardName) => {
				const matchingCards = cardsToShow.filter((c) => c.cardName === cardName);
				const refCard = matchingCards.find((c) => c.cardName === cardName);
				const cardsToShowWithName = cardsToShow.filter((c) => c.cardName === cardName);
				const isInInitialDecklist = !!deckState.deckList.find((c) => c.cardName === cardName);
				// console.debug(
				// 	'isInInitialDecklist',
				// 	cardName,
				// 	isInInitialDecklist,
				// 	deckState.deckList,
				// 	refCard,
				// 	this.allCards.getCard(refCard.cardId),
				// );
				const quantityInDeck = deck.filter((c) => c.cardName === cardName).length;
				const creatorCardIds = cardsToShowWithName.map((c) => c.creatorCardId).filter((id) => !!id);
				const shouldShowGiftLine = !hideGeneratedCardsInOtherZone && !!creatorCardIds.length;
				const shouldShowDeckLine = isInInitialDecklist || quantityInDeck > 0;
				const result: VisualDeckCard[] = [];
				// console.debug(
				// 	'lines to show',
				// 	shouldShowDeckLine,
				// 	shouldShowGiftLine,
				// 	isInInitialDecklist,
				// 	quantityInDeck,
				// 	cardsToShowWithName.filter((c) => !c?.creatorCardId),
				// );

				if (shouldShowDeckLine) {
					const displayMode = !quantityInDeck ? 'dim' : null;
					// const deckCreatorCardIds = deck
					// 	.filter((c) => c.cardName === cardName)
					// 	.map((c) => c.creatorCardId)
					// 	.filter((id) => !!id);
					result.push(
						...Array(Math.max(1, quantityInDeck)).fill(
							VisualDeckCard.create({
								...refCard,
								// Always show the base cost in this display mode
								manaCost: this.allCards.getCard(refCard.cardId)?.cost ?? refCard.manaCost,
								actualManaCost: this.allCards.getCard(refCard.cardId)?.cost ?? refCard.actualManaCost,
								// Don't show a gift icon when the card is in the deck
								creatorCardIds: [],
								// creatorCardIds: deckCreatorCardIds,
								highlight: displayMode,
								internalEntityIds: matchingCards.map((c) => c.internalEntityId),
							}),
						),
					);
					// console.debug('after shouldShowDeckLine', result);
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
								manaCost: this.allCards.getCard(refCard.cardId)?.cost ?? refCard.manaCost,
								actualManaCost: this.allCards.getCard(refCard.cardId)?.cost ?? refCard.actualManaCost,
								creatorCardIds: otherCreatorCardIds,
								highlight: 'dim',
								internalEntityIds: matchingCards.map((c) => c.internalEntityId),
							}),
						),
					);
					// console.debug('after shouldShowGiftLine', result);
				}
				return result;
			})
			.sort((a, b) => a.manaCost - b.manaCost);
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
				// console.debug(
				// 	'lines to show',
				// 	shouldShowDeckLine,
				// 	shouldShowGiftLine,
				// 	quantityInDeck,
				// 	cardsToShowWithName.filter((c) => !c?.creatorCardId),
				// );

				if (shouldShowDeckLine) {
					// Show the cards that we know to still be in deck
					if (quantityInDeck > 0) {
						result.push(
							...Array(quantityInDeck).fill(
								VisualDeckCard.create({
									...refCard,
									// Always show the base cost in this display mode
									manaCost: this.allCards.getCard(refCard.cardId)?.cost ?? refCard.manaCost,
									actualManaCost:
										this.allCards.getCard(refCard.cardId)?.cost ?? refCard.actualManaCost,
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
									manaCost: this.allCards.getCard(refCard.cardId)?.cost ?? refCard.manaCost,
									actualManaCost:
										this.allCards.getCard(refCard.cardId)?.cost ?? refCard.actualManaCost,
									highlight: 'dim',
									internalEntityIds: matchingCards.map((c) => c.internalEntityId),
								}),
							),
						);
					}
					// console.debug('showing for show-played', cardName, quantityInDeck, quantityNotInDeck, result);
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
								manaCost: this.allCards.getCard(refCard.cardId)?.cost ?? refCard.manaCost,
								actualManaCost: this.allCards.getCard(refCard.cardId)?.cost ?? refCard.actualManaCost,
								creatorCardIds: otherCreatorCardIds,
								highlight: 'dim',
								internalEntityIds: matchingCards.map((c) => c.internalEntityId),
							}),
						),
					);
					// console.debug('after shouldShowGiftLine', result);
				}
				return result;
			})
			.sort((a, b) => a.manaCost - b.manaCost);
		return result;
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
			//console.debug('sort order', card.cardName, card.highlight, isGift, card);
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
