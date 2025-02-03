import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
} from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, getProcessedCard } from '@firestone/game-state';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, debounceTime, filter, startWith, takeUntil } from 'rxjs';
import { DeckZone, DeckZoneSection } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { PLAGUES } from '../../../services/decktracker/event-parser/special-cases/plagues-parser';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'deck-list-by-zone',
	styleUrls: ['../../../../css/component/decktracker/overlay/deck-list-by-zone.component.scss'],
	template: `
		<ul class="deck-list">
			<li *ngFor="let zone of zones$ | async; trackBy: trackZone">
				<deck-zone
					[zone]="zone"
					[colorManaCost]="colorManaCost"
					[showRelatedCards]="showRelatedCards"
					[showTransformedInto]="showTransformedInto"
					[showUnknownCards]="showUnknownCards"
					[showUpdatedCost]="showUpdatedCost"
					[showGiftsSeparately]="showGiftsSeparately"
					[groupSameCardsTogether]="groupSameCardsTogether"
					[showStatsChange]="showStatsChange"
					[showTopCardsSeparately]="showTopCardsSeparately$ | async"
					[showBottomCardsSeparately]="showBottomCardsSeparately$ | async"
					[darkenUsedCards]="darkenUsedCards"
					[showTotalCardsInZone]="showTotalCardsInZone"
					[removeDuplicatesInTooltip]="removeDuplicatesInTooltip"
					[side]="side"
				></deck-zone>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckListByZoneComponent extends AbstractSubscriptionComponent implements OnDestroy, AfterContentInit {
	zones$: Observable<readonly DeckZone[]>;
	showTopCardsSeparately$: Observable<boolean>;
	showBottomCardsSeparately$: Observable<boolean>;

	@Input() colorManaCost: boolean;
	@Input() showRelatedCards: boolean;
	@Input() showTransformedInto: boolean;
	@Input() showUpdatedCost: boolean;
	@Input() showUnknownCards: boolean;
	@Input() showGiftsSeparately: boolean;
	@Input() groupSameCardsTogether: boolean;
	@Input() showStatsChange: boolean;
	@Input() showTotalCardsInZone: boolean;
	@Input() removeDuplicatesInTooltip: boolean;
	@Input() side: 'player' | 'opponent' | 'single';

	@Input() set showGlobalEffectsZone(value: boolean) {
		this.showGlobalEffectsZone$$.next(value);
	}

	@Input() set hideGeneratedCardsInOtherZone(value: boolean) {
		this.hideGeneratedCardsInOtherZone$$.next(value);
	}

	@Input() set sortCardsByManaCostInOtherZone(value: boolean) {
		this.sortCardsByManaCostInOtherZone$$.next(value);
	}

	@Input() set showBottomCardsSeparately(value: boolean) {
		this.showBottomCardsSeparately$$.next(value);
	}

	@Input() set showTopCardsSeparately(value: boolean) {
		this.showTopCardsSeparately$$.next(value);
	}

	@Input() set showGeneratedCardsInSeparateZone(value: boolean) {
		this.showGeneratedCardsInSeparateZone$$.next(value);
	}

	@Input() set showPlaguesOnTop(value: boolean) {
		this.showPlaguesOnTop$$.next(value);
	}

	@Input() set showBoardCardsInSeparateZone(value: boolean) {
		this.showBoardCardsInSeparateZone$$.next(value);
	}

	@Input() set showDiscoveryZone(value: boolean) {
		this.showDiscoveryZone$$.next(value);
	}

	@Input() set deckState(value: DeckState) {
		this.deckState$$.next(value);
	}

	@Input() darkenUsedCards: boolean;

	_darkenUsedCards = true;

	private showGlobalEffectsZone$$ = new BehaviorSubject<boolean>(false);
	private hideGeneratedCardsInOtherZone$$ = new BehaviorSubject<boolean>(false);
	private sortCardsByManaCostInOtherZone$$ = new BehaviorSubject<boolean>(false);
	private showBottomCardsSeparately$$ = new BehaviorSubject<boolean>(true);
	private showTopCardsSeparately$$ = new BehaviorSubject<boolean>(true);
	private showGeneratedCardsInSeparateZone$$ = new BehaviorSubject<boolean>(false);
	private showBoardCardsInSeparateZone$$ = new BehaviorSubject<boolean>(false);
	private showDiscoveryZone$$ = new BehaviorSubject<boolean>(true);
	private showPlaguesOnTop$$ = new BehaviorSubject<boolean>(true);
	private deckState$$ = new BehaviorSubject<DeckState>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	trackZone(index, zone: DeckZone) {
		return zone.id;
	}

	ngAfterContentInit(): void {
		this.showTopCardsSeparately$ = this.showTopCardsSeparately$$.asObservable();
		this.showBottomCardsSeparately$ = this.showBottomCardsSeparately$$.asObservable();
		this.zones$ = combineLatest([
			this.deckState$$,
			this.showGlobalEffectsZone$$,
			this.hideGeneratedCardsInOtherZone$$,
			this.sortCardsByManaCostInOtherZone$$,
			this.showBottomCardsSeparately$$,
			this.showTopCardsSeparately$$,
			this.showGeneratedCardsInSeparateZone$$,
			this.showBoardCardsInSeparateZone$$,
			this.showPlaguesOnTop$$,
			this.showDiscoveryZone$$,
		]).pipe(
			filter(([deckState, _]) => !!deckState),
			debounceTime(200),
			startWith([]),
			this.mapData(
				([
					deckState,
					showGlobalEffectsZone,
					hideGeneratedCardsInOtherZone,
					sortCardsByManaCostInOtherZone,
					showBottomCardsSeparately,
					showTopCardsSeparately,
					showGeneratedCardsInSeparateZone,
					showBoardCardsInSeparateZone,
					showPlaguesOnTop,
					showDiscoveryZone,
				]) =>
					this.buildZones(
						showGlobalEffectsZone,
						hideGeneratedCardsInOtherZone,
						sortCardsByManaCostInOtherZone,
						showBottomCardsSeparately,
						showTopCardsSeparately,
						showGeneratedCardsInSeparateZone,
						showBoardCardsInSeparateZone,
						showPlaguesOnTop,
						showDiscoveryZone,
						deckState,
					),
			),
			// tap((zones) => console.debug('[deck-list-by-zone] zones', zones)),
			takeUntil(this.destroyed$),
		);
	}

	private buildZones(
		showGlobalEffectsZone: boolean,
		hideGeneratedCardsInOtherZone: boolean,
		sortCardsByManaCostInOtherZone: boolean,
		showBottomCardsSeparately: boolean,
		showTopCardsSeparately: boolean,
		showGeneratedCardsInSeparateZone: boolean,
		showBoardCardsInSeparateZone: boolean,
		showPlaguesOnTop: boolean,
		showDiscoveryZone: boolean,
		deckState: DeckState,
	): readonly DeckZone[] {
		if (!deckState) {
			return;
		}
		const zones = [];

		// Global effects
		if (showGlobalEffectsZone && deckState.globalEffects.length > 0) {
			zones.push(
				this.buildZone(
					deckState.globalEffects,
					null,
					'global-effects',
					this.i18n.translateString('decktracker.zones.global-effects'),
					null,
					null,
				),
			);
		}

		// Deck
		const deckSections: InternalDeckZoneSection[] = [];
		let cardsInDeckZone = deckState.deck;
		if (showTopCardsSeparately && deckState.deck.filter((c) => c.positionFromTop != undefined).length) {
			deckSections.push({
				header: this.i18n.translateString('decktracker.zones.top-of-deck'),
				sortingFunction: (a, b) => a.positionFromTop - b.positionFromTop,
				cards: deckState.deck.filter((c) => c.positionFromTop != undefined),
				order: -1,
			});
			cardsInDeckZone = cardsInDeckZone.filter((c) => c.positionFromTop == undefined);
		}
		if (showBottomCardsSeparately && deckState.deck.filter((c) => c.positionFromBottom != undefined).length) {
			deckSections.push({
				header: this.i18n.translateString('decktracker.zones.bottom-of-deck'),
				sortingFunction: (a, b) => a.positionFromBottom - b.positionFromBottom,
				cards: deckState.deck.filter((c) => c.positionFromBottom != undefined),
				order: 1,
			});
			cardsInDeckZone = cardsInDeckZone.filter((c) => c.positionFromBottom == undefined);
		}
		deckSections.push({
			header: deckSections.length == 0 ? null : this.i18n.translateString('decktracker.zones.in-deck'),
			cards: cardsInDeckZone,
			sortingFunction: showPlaguesOnTop
				? (a, b) => (PLAGUES.includes(a.cardId as CardIds) ? -1 : PLAGUES.includes(b.cardId as CardIds) ? 1 : 0)
				: null,
			order: 0,
		});
		zones.push(
			Object.assign(
				this.buildZone(
					null,
					deckSections.sort((a, b) => a.order - b.order),
					'deck',
					this.i18n.translateString('decktracker.zones.in-deck'),
					null,
					deckState.cardsLeftInDeck,
				),
				{
					showWarning: deckState.showDecklistWarning,
				} as DeckZone,
			),
		);

		// Hand
		zones.push(
			this.buildZone(
				deckState.hand,
				null,
				'hand',
				this.i18n.translateString('decktracker.zones.in-hand'),
				null,
				deckState.hand.length,
				null,
				'in-hand',
			),
		);

		// Board
		if (showBoardCardsInSeparateZone) {
			const boardZone = [...deckState.board, deckState.weapon].filter((c) => !!c);
			zones.push(
				this.buildZone(
					boardZone,
					null,
					'board',
					this.i18n.translateString('decktracker.zones.board'),
					sortCardsByManaCostInOtherZone
						? (a, b) => a.refManaCost - b.refManaCost
						: (a, b) => this.sortByIcon(a, b),
					null,
				),
			);
		}

		if (showDiscoveryZone && !!deckState.currentOptions?.length) {
			const discoveryCards = deckState.currentOptions.map((o) => {
				const defaultCard = DeckCard.create({
					cardId: o.cardId,
					entityId: o.entityId,
					refManaCost: this.allCards.getCard(o.cardId)?.hideStats
						? null
						: getProcessedCard(o.cardId, o.entityId, deckState, this.allCards).cost,
				});
				return defaultCard;
			});
			zones.push(
				this.buildZone(
					discoveryCards,
					null,
					'discovery',
					this.i18n.translateString('decktracker.zones.discovery'),
					(a, b) => 0, // Keep initial order
					null,
				),
			);
		}

		// Other
		const otherZoneFromDeck = deckState.otherZone ?? [];
		// We don't want to show the weapons equipped directly by hero powers
		// Actually we do, as the origin of the weapon doesn't really change how it is interacted with
		// .filter(
		// 	(c) =>
		// 		this.allCards.getCard(c.cardId)?.type?.toUpperCase() !== CardType[CardType.WEAPON] ||
		// 		this.allCards.getCard(c.creatorCardId)?.type?.toUpperCase() !== CardType[CardType.HERO_POWER],
		// );
		const otherZone = [
			...otherZoneFromDeck
				// Frizz creates PLAY entities that don't have any information
				// D 17:41:27.4774901 PowerTaskList.DebugPrintPower() -     FULL_ENTITY - Updating [entityName=UNKNOWN ENTITY [cardType=INVALID] id=91 zone=SETASIDE zonePos=0 cardId= player=1] CardID=
				// D 17:41:27.4774901 PowerTaskList.DebugPrintPower() -         tag=ZONE value=SETASIDE
				// D 17:41:27.4774901 PowerTaskList.DebugPrintPower() -         tag=CONTROLLER value=1
				// D 17:41:27.4774901 PowerTaskList.DebugPrintPower() -         tag=ENTITY_ID value=91
				// D 17:41:27.4774901 PowerTaskList.DebugPrintPower() -     TAG_CHANGE Entity=[entityName=UNKNOWN ENTITY [cardType=INVALID] id=91 zone=SETASIDE zonePos=0 cardId= player=1] tag=ZONE value=PLAY
				// In the Other zone, we only want to have known cards (as they have been played / removed / etc.)
				.filter((c) => !!c.cardId?.length)
				.filter((c) => (c.cardType ?? this.allCards.getCard(c.cardId).type)?.toLowerCase() !== 'enchantment'),
			...(showBoardCardsInSeparateZone ? [] : deckState.board),
		].filter((c) => (showGeneratedCardsInSeparateZone ? !c.creatorCardId?.length && !c.stolenFromOpponent : true));
		zones.push(
			this.buildZone(
				otherZone,
				null,
				'other',
				this.i18n.translateString('decktracker.zones.other'),
				sortCardsByManaCostInOtherZone
					? (a, b) => a.refManaCost - b.refManaCost
					: (a, b) => this.sortByIcon(a, b),
				null,
				// We want to keep the info in the deck state (that there are cards in the SETASIDE zone) but
				// not show them in the zones
				// (a: VisualDeckCard) => a.zone !== 'SETASIDE',
				// Cards like Tracking put cards from the deck to the SETASIDE zone, so we want to
				// keep them in fact. We have added a specific flag for cards that are just here
				// for technical reasons
				(a: VisualDeckCard) =>
					// See comment on temporary cards in grouped-deck-list.component.ts
					(!a.temporaryCard || a.zone !== 'SETASIDE') &&
					!a.createdByJoust &&
					!(hideGeneratedCardsInOtherZone && a.creatorCardId) &&
					!(hideGeneratedCardsInOtherZone && a.creatorCardIds && a.creatorCardIds.length > 0),
			),
		);

		if (showGeneratedCardsInSeparateZone) {
			const otherGeneratedZone = [
				...otherZoneFromDeck
					.filter((c) => !!c.cardId?.length)
					.filter(
						(c) => (c.cardType ?? this.allCards.getCard(c.cardId).type)?.toLowerCase() !== 'enchantment',
					),
				...(showBoardCardsInSeparateZone ? [] : deckState.board),
			].filter((c) => !!c.creatorCardId?.length || c.stolenFromOpponent);
			zones.push(
				this.buildZone(
					otherGeneratedZone,
					null,
					'other-generated',
					this.i18n.translateString('decktracker.zones.other-generated'),
					sortCardsByManaCostInOtherZone
						? (a, b) => a.refManaCost - b.refManaCost
						: (a, b) => this.sortByIcon(a, b),
					null,
					(a: VisualDeckCard) => (!a.temporaryCard || a.zone !== 'SETASIDE') && !a.createdByJoust,
				),
			);
		}

		return zones;
	}

	private buildZone(
		cards: readonly DeckCard[],
		zones: readonly InternalDeckZoneSection[],
		id: string,
		name: string,
		sortingFunction: (a: VisualDeckCard, b: VisualDeckCard) => number,
		numberOfCards: number,
		filterFunction?: (a: VisualDeckCard) => boolean,
		highlight?: string,
	): DeckZone {
		let sections: DeckZoneSection[] = [];
		if (zones == null) {
			sections.push({
				header: null,
				cards: cards
					.map((card) =>
						VisualDeckCard.create(card).update({
							creatorCardIds: (card.creatorCardId ? [card.creatorCardId] : []) as readonly string[],
							lastAffectedByCardIds: (card.lastAffectedByCardId
								? [card.lastAffectedByCardId]
								: []) as readonly string[],
							highlight: highlight as any,
						}),
					)
					.filter((card) => !filterFunction || filterFunction(card)),
				sortingFunction: sortingFunction,
			});
		} else if (cards == null) {
			sections = zones.map((zone) => ({
				header: zone.header,
				cards: zone.cards
					.map((card) =>
						VisualDeckCard.create(card).update({
							creatorCardIds: (card.creatorCardId ? [card.creatorCardId] : []) as readonly string[],
							lastAffectedByCardIds: (card.lastAffectedByCardId
								? [card.lastAffectedByCardId]
								: []) as readonly string[],
							highlight: highlight as any,
						}),
					)
					.filter((card) => !filterFunction || filterFunction(card)),
				sortingFunction: zone.sortingFunction,
			}));
		}
		if (numberOfCards !== null && numberOfCards !== sections.flatMap((section) => section.cards).length) {
			// console.warn(
			// 	'incorrect number of cards in zone',
			// 	name,
			// 	numberOfCards,
			// 	sections.flatMap((section) => section.cards).length,
			// );
		}
		return {
			id: id,
			name: name,
			numberOfCards: numberOfCards != null ? numberOfCards : sections.flatMap((section) => section.cards).length,
			sections: sections,
		} as DeckZone;
	}

	private sortByIcon(a: VisualDeckCard, b: VisualDeckCard): number {
		if (a.zone === 'PLAY' && b.zone !== 'PLAY') {
			return -1;
		}
		if (a.zone !== 'PLAY' && b.zone === 'PLAY') {
			return 1;
		}
		if (a.zone === 'GRAVEYARD' && b.zone !== 'GRAVEYARD') {
			return -1;
		}
		if (a.zone !== 'GRAVEYARD' && b.zone === 'GRAVEYARD') {
			return 1;
		}
		if (a.zone === 'DISCARD' && b.zone !== 'DISCARD') {
			return -1;
		}
		if (a.zone !== 'DISCARD' && b.zone === 'DISCARD') {
			return 1;
		}
		if (a.countered && !b.countered) {
			return -1;
		}
		if (!a.countered && b.countered) {
			return 1;
		}
		return 0;
	}
}

export interface InternalDeckZoneSection {
	header: string;
	cards: readonly DeckCard[];
	sortingFunction: (a: VisualDeckCard, b: VisualDeckCard) => number;
	order?: number;
}
