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
import { CardIds, COIN_IDS } from '@firestone-hs/reference-data';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckZone, DeckZoneSection } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { SetCard } from '../../../models/set';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'grouped-deck-list',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/grouped-deck-list.component.scss',
	],
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
				[showGiftsSeparately]="showGiftsSeparately"
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

	@Input() colorManaCost: boolean;
	@Input() showRelatedCards: boolean;
	@Input() showUnknownCards: boolean;
	@Input() showUpdatedCost: boolean;
	@Input() showGiftsSeparately: boolean;
	@Input() showStatsChange: boolean;
	@Input() showTotalCardsInZone: boolean;
	@Input() side: 'player' | 'opponent';
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

	@Input() set darkenUsedCards(value: boolean) {
		this.darkenUsedCards$$.next(value);
	}

	@Input() set showBottomCardsSeparately(value: boolean) {
		this.showBottomCardsSeparately$$.next(value);
	}

	@Input() set showTopCardsSeparately(value: boolean) {
		this.showTopCardsSeparately$$.next(value);
	}

	_tooltipPosition: CardTooltipPositionType;

	private deckState$$ = new BehaviorSubject<DeckState>(null);
	private showWarning$$ = new BehaviorSubject<boolean>(null);
	private cardsGoToBottom$$ = new BehaviorSubject<boolean>(false);
	private darkenUsedCards$$ = new BehaviorSubject<boolean>(false);
	private showBottomCardsSeparately$$ = new BehaviorSubject<boolean>(true);
	private showTopCardsSeparately$$ = new BehaviorSubject<boolean>(true);

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
		this.zone$ = combineLatest(
			this.deckState$$.asObservable(),
			this.showWarning$$.asObservable(),
			this.cardsGoToBottom$$.asObservable(),
			this.darkenUsedCards$$.asObservable(),
			this.showTopCardsSeparately$,
			this.showBottomCardsSeparately$,
		).pipe(
			this.mapData(
				([
					deckState,
					showWarning,
					cardsGoToBottom,
					darkenUsedCards,
					showTopCardsSeparately,
					showBottomCardsSeparately,
				]) =>
					this.buildGroupedList(
						deckState,
						showWarning,
						cardsGoToBottom,
						darkenUsedCards,
						showTopCardsSeparately,
						showBottomCardsSeparately,
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
		darkenUsedCards: boolean,
		showTopCardsSeparately: boolean,
		showBottomCardsSeparately: boolean,
	) {
		if (!deckState) {
			return null;
		}

		console.debug('rebuilding grouped listd');
		const base = this.buildBaseCards(deckState, darkenUsedCards);

		const sortingFunction = cardsGoToBottom
			? (a: VisualDeckCard, b: VisualDeckCard) => this.sortOrder(a) - this.sortOrder(b) || a.manaCost - b.manaCost
			: null;

		const deckSections: InternalDeckZoneSection[] = [];
		let cardsInDeckZone = base;
		if (showTopCardsSeparately && base.filter((c) => c.positionFromTop != undefined).length) {
			deckSections.push({
				header: this.i18n.translateString('decktracker.zones.top-of-deck'),
				sortingFunction: (a, b) => a.positionFromTop - b.positionFromTop,
				cards: base.filter((c) => c.positionFromTop != undefined),
				order: -1,
			});
			cardsInDeckZone = cardsInDeckZone.filter((c) => c.positionFromTop == undefined);
		}
		if (showBottomCardsSeparately && base.filter((c) => c.positionFromBottom != undefined).length) {
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
		return {
			id: 'single-zone',
			name: undefined,
			numberOfCards: base.length,
			showWarning: showWarning,
			sections: sections,
		};
	}

	private buildBaseCards(deckState: DeckState, darkenUsedCards: boolean): readonly VisualDeckCard[] {
		// Here we should get all the cards that were part of the initial deck
		const allCards = [
			...deckState.deck,
			...deckState.hand.filter((c) => !c.creatorCardId),
			...deckState.board.filter((c) => !c.creatorCardId),
			...deckState.otherZone
				.filter((c) => c.zone !== 'SETASIDE')
				.filter((c) => !c.creatorCardId)
				.filter((c) => !c.temporaryCard),
		].sort((a, b) => a.manaCost - b.manaCost);

		// One line for each card id
		const cardIdsToShow = [...new Set(allCards.map((c) => c.cardId))];

		const finalCards = cardIdsToShow
			// TODO: Because the initial coin doesn't have a "created by" (because it's created by the game)
			// This should probably be fixed on the initial Coin instead, but for now here's a temporary patch
			.filter((cardId) => !COIN_IDS.includes(cardId as CardIds))
			.flatMap((cardId) => {
				if (!deckState.deck.filter((c) => c.cardId === cardId).length) {
					const refCard = allCards.find((c) => c.cardId === cardId);
					return [
						VisualDeckCard.create({
							// Just take the first one as placeholder
							...refCard,
							manaCost: this.allCards.getCard(refCard.cardId).cost ?? refCard.manaCost, // Show the base cost, not the reduction
							highlight: darkenUsedCards ? 'dim' : 'normal',
						}),
					];
				} else {
					return deckState.deck
						.filter((c) => c.cardId === cardId)
						.map((c) => VisualDeckCard.create({ ...c }));
				}
			});
		return finalCards;
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
}
