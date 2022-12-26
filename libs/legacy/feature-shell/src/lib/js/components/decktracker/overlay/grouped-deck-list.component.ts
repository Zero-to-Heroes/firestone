import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output
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

	@Input() set hideGeneratedCardsInOtherZone(value: boolean) {
		this.hideGeneratedCardsInOtherZone$$.next(value);
	}

	_tooltipPosition: CardTooltipPositionType;

	private deckState$$ = new BehaviorSubject<DeckState>(null);
	private showWarning$$ = new BehaviorSubject<boolean>(null);
	private cardsGoToBottom$$ = new BehaviorSubject<boolean>(false);
	private showBottomCardsSeparately$$ = new BehaviorSubject<boolean>(true);
	private showTopCardsSeparately$$ = new BehaviorSubject<boolean>(true);
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
		this.zone$ = combineLatest(
			this.deckState$$.asObservable(),
			this.showWarning$$.asObservable(),
			this.cardsGoToBottom$$.asObservable(),
			this.hideGeneratedCardsInOtherZone$$.asObservable(),
			this.showTopCardsSeparately$,
			this.showBottomCardsSeparately$,
		).pipe(
			this.mapData(
				([
					deckState,
					showWarning,
					cardsGoToBottom,
					hideGeneratedCardsInOtherZone,
					showTopCardsSeparately,
					showBottomCardsSeparately,
				]) =>
					this.buildGroupedList(
						deckState,
						showWarning,
						cardsGoToBottom,
						hideGeneratedCardsInOtherZone,
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
		hideGeneratedCardsInOtherZone: boolean,
		showTopCardsSeparately: boolean,
		showBottomCardsSeparately: boolean,
	) {
		if (!deckState) {
			return null;
		}

		const base = this.buildBaseCards(deckState, hideGeneratedCardsInOtherZone);
		console.debug('base cards', this.buildBaseCards);

		const sortingFunction = (a: VisualDeckCard, b: VisualDeckCard) =>
			this.sortOrder(a, cardsGoToBottom) - this.sortOrder(b, cardsGoToBottom) || a.manaCost - b.manaCost;

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

	private buildBaseCards(deckState: DeckState, hideGeneratedCardsInOtherZone: boolean): readonly VisualDeckCard[] {
		// Here we should get all the cards that were part of the initial deck
		const cardsToShow = [
			...deckState.deck
				// Remove "unknown cards"
				.filter((c) => !!c.cardId || !!c.creatorCardId),
			...deckState.hand
				.filter((c) => !c.creatorCardId)
				// Remove "unknown cards"
				.filter((c) => !!c.cardId),
			...deckState.board.filter((c) => !c.creatorCardId),
			...deckState.otherZone
				.filter((c) => !!c.cardId)
				.filter((c) => !hideGeneratedCardsInOtherZone || !c.creatorCardId)
				// Cards that get discovered as sometimes marked as "temporary cards". Sometimes the game creates copies, sometimes
				// not. There might be a way to make sure we know what is what (based on the linkedEntityId), but I need to investigate
				// that
				// How to handle discarded cards? They should probably be handled in the same way as cards played in the "other" zone
				.filter((c) => c.zone !== 'SETASIDE' || !c.temporaryCard),
		].filter((card) => !COIN_IDS.includes(card.cardId as CardIds));
		// These include all the cards that were at some point part of the initial deck
		const uniqueCardNames = [...new Set(cardsToShow.map((c) => c.cardName))];
		const uniqueCardIds = [...new Set(cardsToShow.map((c) => c.cardId))];
		console.debug('uniqueCardIds', uniqueCardIds, uniqueCardNames);
		const result = uniqueCardNames
			.flatMap((cardName) => {
				const quantityToShow = deckState.deck.filter((c) => c.cardName === cardName).length;
				// const quantityToShow = deckState.deck.filter((c) => c.cardId === cardId).length;
				const displayMode = !quantityToShow ? 'dim' : null;
				const refCard = cardsToShow.find((c) => c.cardName === cardName);
				return Array(Math.max(1, quantityToShow)).fill(
					VisualDeckCard.create({
						...refCard,
						creatorCardIds: (refCard.creatorCardId ? [refCard.creatorCardId] : []) as readonly string[],
						highlight: displayMode,
					}),
				);
			})
			.sort((a, b) => a.manaCost - b.manaCost);
		console.debug(
			'showing cards',
			result.map((c) => ({ name: c.cardName, ...c })),
		);
		return result;
	}

	private sortOrder(card: VisualDeckCard, cardsGoToBottom: boolean): number {
		// Generated cards always go to the bottom
		if (!!card.creatorCardId?.length || !!card.creatorCardIds?.length) {
			return 3;
		}

		if (cardsGoToBottom) {
			switch (card.highlight) {
				case 'normal':
					return 0;
				case 'in-hand':
					return 1;
				case 'dim':
					return 2;
				default:
					return 0;
			}
		}
		return 0;
	}
}
