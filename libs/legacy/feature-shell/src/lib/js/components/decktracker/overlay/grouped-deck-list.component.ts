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
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { DeckZone, DeckZoneSection } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { SetCard } from '../../../models/set';
import { PLAGUES } from '../../../services/decktracker/event-parser/special-cases/plagues-parser';
import { shouldKeepOriginalCost } from '../../../services/hs-utils';

@Component({
	selector: 'grouped-deck-list',
	styleUrls: ['../../../../css/component/decktracker/overlay/grouped-deck-list.component.scss'],
	template: `
		<ul class="deck-list">
			<deck-zone
				*ngIf="zone$ | async as zone"
				[zone]="zone"
				[colorManaCost]="colorManaCost"
				[showRelatedCards]="showRelatedCards"
				[showUnknownCards]="showUnknownCards"
				[showUpdatedCost]="showUpdatedCost"
				[showGiftsSeparately]="showGiftsSeparately$ | async"
				[groupSameCardsTogether]="groupSameCardsTogether$ | async"
				[showStatsChange]="showStatsChange$ | async"
				[showTopCardsSeparately]="showTopCardsSeparately$ | async"
				[showBottomCardsSeparately]="showBottomCardsSeparately$ | async"
				[side]="side"
				[showTotalCardsInZone]="showTotalCardsInZone"
				[removeDuplicatesInTooltip]="removeDuplicatesInTooltip"
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
	showStatsChange$: Observable<boolean>;

	@Input() colorManaCost: boolean;
	@Input() showRelatedCards: boolean;
	@Input() showUnknownCards: boolean;
	@Input() showUpdatedCost: boolean;
	@Input() showTotalCardsInZone: boolean;
	@Input() removeDuplicatesInTooltip: boolean;
	@Input() side: 'player' | 'opponent' | 'duels';
	@Input() collection: readonly SetCard[];

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
	@Input() set showStatsChange(value: boolean) {
		this.showStatsChange$$.next(value);
	}
	@Input() set showPlaguesOnTop(value: boolean) {
		this.showPlaguesOnTop$$.next(value);
	}

	private deckState$$ = new BehaviorSubject<DeckState>(null);
	private showWarning$$ = new BehaviorSubject<boolean>(null);
	private cardsGoToBottom$$ = new BehaviorSubject<boolean>(false);
	private showBottomCardsSeparately$$ = new BehaviorSubject<boolean>(true);
	private showTopCardsSeparately$$ = new BehaviorSubject<boolean>(true);
	private showGiftsSeparately$$ = new BehaviorSubject<boolean>(true);
	private groupSameCardsTogether$$ = new BehaviorSubject<boolean>(false);
	private hideGeneratedCardsInOtherZone$$ = new BehaviorSubject<boolean>(false);
	private showStatsChange$$ = new BehaviorSubject<boolean>(false);
	private showPlaguesOnTop$$ = new BehaviorSubject<boolean>(false);

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
		this.showStatsChange$ = this.showStatsChange$$.asObservable().pipe(this.mapData((info) => info));
		this.zone$ = combineLatest([
			this.deckState$$.asObservable(),
			this.showWarning$$.asObservable(),
			this.cardsGoToBottom$$.asObservable(),
			this.hideGeneratedCardsInOtherZone$$.asObservable(),
			this.showTopCardsSeparately$,
			this.showBottomCardsSeparately$,
			this.showGiftsSeparately$,
			this.showStatsChange$$,
			this.groupSameCardsTogether$,
			this.showPlaguesOnTop$$,
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
					showStatsChange,
					groupSameCardsTogether,
					showPlaguesOnTop,
				]) =>
					this.buildGroupedList(
						deckState,
						showWarning,
						cardsGoToBottom,
						hideGeneratedCardsInOtherZone,
						showTopCardsSeparately,
						showBottomCardsSeparately,
						showGiftsSeparately,
						showStatsChange,
						groupSameCardsTogether,
						showPlaguesOnTop,
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
		showStatsChange: boolean,
		groupSameCardsTogether: boolean,
		showPlaguesOnTop: boolean,
	) {
		if (!deckState) {
			return null;
		}

		const sortingFunction = (a: VisualDeckCard, b: VisualDeckCard) =>
			this.sortOrder(a, cardsGoToBottom, showGiftsSeparately, showPlaguesOnTop) -
			this.sortOrder(b, cardsGoToBottom, showGiftsSeparately, showPlaguesOnTop);

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
		const base = this.buildBaseCards(deckForBase, hideGeneratedCardsInOtherZone, showStatsChange);
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

	private buildBaseCards(
		deckState: DeckState,
		hideGeneratedCardsInOtherZone: boolean,
		showStatsChange: boolean,
	): readonly VisualDeckCard[] {
		const mode = !!deckState.deckList?.length ? 'focus-decklist' : 'show-played';
		const baseCards: readonly VisualDeckCard[] =
			mode === 'focus-decklist'
				? this.buildBaseCardForFocus(deckState, hideGeneratedCardsInOtherZone, showStatsChange)
				: this.buildBaseCardsForShowPlayed(deckState, hideGeneratedCardsInOtherZone, showStatsChange);
		return baseCards;
	}

	private buildBaseCardForFocus(
		deckState: DeckState,
		hideGeneratedCardsInOtherZone: boolean,
		showStatsChange: boolean,
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
		const uniqueCardNames = [...new Set(cardsToShow.map((c) => c.cardName))].sort();
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
					const statModifiers = !showStatsChange
						? [null]
						: [...new Set(matchingCards.map((c) => c.mainAttributeChange ?? null))];
					for (const statsModifier of statModifiers) {
						const quantityInDeckWithStat = deck.filter(
							(c) =>
								c.cardName === cardName &&
								(showStatsChange ? c.mainAttributeChange == statsModifier : true),
						).length;
						result.push(
							...Array(Math.max(1, quantityInDeckWithStat)).fill(
								VisualDeckCard.create({
									...refCard,
									// Always show the base cost in this display mode
									refManaCost: this.allCards.getCard(refCard.cardId).hideStats
										? null
										: this.getManaCost(refCard),
									actualManaCost: this.getManaCost(refCard),
									// Don't show a gift icon when the card is in the deck
									creatorCardIds: [],
									highlight: displayMode,
									internalEntityIds: matchingCards.map((c) => c.internalEntityId),
									mainAttributeChange: statsModifier,
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
								refManaCost: this.allCards.getCard(refCard.cardId).hideStats
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
			.sort(sortByProperties((a: VisualDeckCard) => [a.refManaCost]));
		return result;
	}

	private buildBaseCardsForShowPlayed(
		deckState: DeckState,
		hideGeneratedCardsInOtherZone: boolean,
		showStatsChange: boolean,
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
						const statModifiers = !showStatsChange
							? [null]
							: [...new Set(matchingCards.map((c) => c.mainAttributeChange))];
						for (const statsModifier of statModifiers) {
							const quantityInDeckWithStat = deck.filter(
								(c) =>
									c.cardName === cardName &&
									(showStatsChange ? c.mainAttributeChange === statsModifier : true),
							).length;
							result.push(
								...Array(quantityInDeckWithStat).fill(
									VisualDeckCard.create({
										...refCard,
										// Always show the base cost in this display mode
										refManaCost: this.getManaCost(refCard),
										actualManaCost: this.getManaCost(refCard),
										creatorCardIds: [],
										highlight: null,
										internalEntityIds: matchingCards.map((c) => c.internalEntityId),
										mainAttributeChange: statsModifier,
									}),
								),
							);
						}
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
									refManaCost: this.allCards.getCard(refCard.cardId).hideStats
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
								refManaCost: this.allCards.getCard(refCard.cardId).hideStats
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
			.sort(sortByProperties((a: VisualDeckCard) => [a.refManaCost]));
		return result;
	}

	private getManaCost(refCard: DeckCard): number {
		if (shouldKeepOriginalCost(refCard.cardId)) {
			return refCard.refManaCost;
		}
		return this.allCards.getCard(refCard.cardId).cost ?? refCard.refManaCost;
	}

	private sortOrder(
		card: VisualDeckCard,
		cardsGoToBottom: boolean,
		showGiftsSeparately: boolean,
		showPlaguesOnTop: boolean,
	): number {
		if (showPlaguesOnTop && PLAGUES.includes(card.cardId as CardIds)) {
			return -1;
		}
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
