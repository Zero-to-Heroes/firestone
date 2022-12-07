import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Optional,
	Output,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckZone, DeckZoneSection } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { SetCard } from '../../../models/set';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'deck-zone',
	styleUrls: [
		'../../../../css/component/decktracker/overlay/deck-zone.component.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
	],
	template: `
		<div class="deck-zone {{ className$ | async }}" [ngClass]="{ 'darken-used-cards': darkenUsedCards }">
			<div class="zone-name-container" *ngIf="zoneName$ | async as zoneName" (mousedown)="toggleZone()">
				<div class="zone-name">
					<span>{{ zoneName }} ({{ cardsInZone$ | async }})</span>
					<div *ngIf="showWarning$ | async" class="warning">
						<svg
							helpTooltip="The actual cards in this deck are randomly chosen from all the cards in the list below"
							[bindTooltipToGameWindow]="true"
						>
							<use xlink:href="assets/svg/sprite.svg#attention" />
						</svg>
					</div>
				</div>
				<i class="collapse-caret {{ (open$ | async) ? 'open' : 'close' }}">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#collapse_caret" />
					</svg>
				</i>
			</div>
			<ul class="card-list" *ngIf="open$ | async">
				<div *ngFor="let section of cardSections$ | async; trackBy: trackBySection" class="section">
					<div class="header" *ngIf="section.header">{{ section.header }}</div>
					<li *ngFor="let card of section.cards; trackBy: trackCard">
						<deck-card
							[card]="card"
							[tooltipPosition]="tooltipPosition"
							[colorManaCost]="colorManaCost"
							[showRelatedCards]="showRelatedCards"
							[showUnknownCards]="showUnknownCards && (showTotalCardsInZone$ | async)"
							[showUpdatedCost]="showUpdatedCost$ | async"
							[showStatsChange]="showStatsChange$ | async"
							[zone]="zone$ | async"
							[side]="side$ | async"
							(cardClicked)="onCardClicked($event)"
						></deck-card>
					</li>
				</div>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckZoneComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Output() cardClicked: EventEmitter<VisualDeckCard> = new EventEmitter<VisualDeckCard>();

	cardSections$: Observable<readonly DeckZoneSection[]>;
	open$: Observable<boolean>;
	zone$: Observable<DeckZone>;
	side$: Observable<'player' | 'opponent' | 'duels'>;
	showUpdatedCost$: Observable<boolean>;
	showStatsChange$: Observable<boolean>;
	showTotalCardsInZone$: Observable<boolean>;
	className$: Observable<string>;
	zoneName$: Observable<string>;
	showWarning$: Observable<boolean>;
	cardsInZone$: Observable<string>;

	@Input() colorManaCost: boolean;
	@Input() showRelatedCards: boolean;
	@Input() showUnknownCards: boolean;
	@Input() darkenUsedCards: boolean;
	@Input() tooltipPosition: CardTooltipPositionType;

	@Input() set zone(zone: DeckZone) {
		this.zone$$.next(zone);
	}
	@Input() set collection(value: readonly SetCard[]) {
		this.collection$$.next(value);
	}
	@Input() set side(value: 'player' | 'opponent' | 'duels') {
		this.side$$.next(value);
	}
	@Input() set showUpdatedCost(value: boolean) {
		this.showUpdatedCost$$.next(value);
	}
	@Input() set showGiftsSeparately(value: boolean) {
		this.showGiftsSeparately$$.next(value);
	}
	@Input() set showStatsChange(value: boolean) {
		this.showStatsChange$$.next(value);
	}
	@Input() set showBottomCardsSeparately(value: boolean) {
		this.showBottomCardsSeparately$$.next(value);
	}
	@Input() set showTopCardsSeparately(value: boolean) {
		this.showTopCardsSeparately$$.next(value);
	}
	@Input() set showTotalCardsInZone(value: boolean) {
		this.showTotalCardsInZone$$.next(value);
	}

	private zone$$ = new BehaviorSubject<DeckZone>(null);
	private collection$$ = new BehaviorSubject<readonly SetCard[]>(null);
	private side$$ = new BehaviorSubject<'player' | 'opponent' | 'duels'>(null);
	private open$$ = new BehaviorSubject<boolean>(true);
	private showUpdatedCost$$ = new BehaviorSubject<boolean>(true);
	private showGiftsSeparately$$ = new BehaviorSubject<boolean>(true);
	private showStatsChange$$ = new BehaviorSubject<boolean>(true);
	private showBottomCardsSeparately$$ = new BehaviorSubject<boolean>(true);
	private showTopCardsSeparately$$ = new BehaviorSubject<boolean>(true);
	private showTotalCardsInZone$$ = new BehaviorSubject<boolean>(true);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		@Optional() private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.zone$ = this.zone$$.asObservable().pipe(this.mapData((info) => info));
		this.side$ = this.side$$.asObservable().pipe(this.mapData((info) => info));
		this.open$ = this.open$$.asObservable().pipe(this.mapData((info) => info, null, 0));
		this.showUpdatedCost$ = this.showUpdatedCost$$.asObservable().pipe(this.mapData((info) => info));
		this.showStatsChange$ = this.showStatsChange$$.asObservable().pipe(this.mapData((info) => info));
		this.showTotalCardsInZone$ = this.showTotalCardsInZone$$.asObservable().pipe(this.mapData((info) => info));
		this.className$ = this.zone$.pipe(this.mapData((zone) => zone?.id));
		this.zoneName$ = this.zone$.pipe(this.mapData((zone) => zone?.name));
		this.showWarning$ = this.zone$.pipe(this.mapData((zone) => zone?.showWarning));
		this.cardsInZone$ = combineLatest(this.showTotalCardsInZone$, this.zone$).pipe(
			this.mapData(([showTotalCardsInZone, zone]) => (showTotalCardsInZone ? `${zone.numberOfCards}` : '-')),
		);

		this.cardSections$ = combineLatest(
			this.zone$,
			this.collection$$.asObservable(),
			this.showUpdatedCost$,
			this.showStatsChange$,
			this.showGiftsSeparately$$.asObservable(),
			this.showBottomCardsSeparately$$.asObservable(),
			this.showTopCardsSeparately$$.asObservable(),
		).pipe(
			this.mapData(
				([
					zone,
					collection,
					showUpdatedCost,
					showStatsChange,
					showGiftsSeparately,
					showBottomCardsSeparately,
					showTopCardsSeparately,
				]) =>
					this.refreshZone(
						zone,
						collection,
						showUpdatedCost,
						showStatsChange,
						showGiftsSeparately,
						showBottomCardsSeparately,
						showTopCardsSeparately,
					),
			),
		);

		combineLatest(this.side$, this.zoneName$)
			.pipe(this.mapData((info) => info))
			.subscribe(async ([side, zoneName]) => {
				const newOpen = !(await this.prefs?.getZoneToggleDefaultClose(zoneName, side));
				this.open$$.next(newOpen);
			});
		combineLatest(this.side$, this.zoneName$, this.open$)
			.pipe(this.mapData((info) => info))
			.subscribe(([side, zoneName, open]) => this.prefs?.setZoneToggleDefaultClose(zoneName, side, !open));
	}

	toggleZone() {
		this.open$$.next(!this.open$$.value);
	}

	onCardClicked(card: VisualDeckCard) {
		this.cardClicked.next(card);
	}

	trackCard(index, card: VisualDeckCard) {
		return card.cardId;
	}

	trackBySection(index: number, item: DeckZoneSection) {
		return item.header;
	}

	private refreshZone(
		zone: DeckZone,
		collection: readonly SetCard[],
		showUpdatedCost: boolean,
		showStatsChange: boolean,
		showGiftsSeparately: boolean,
		showBottomCardsSeparately: boolean,
		showTopCardsSeparately: boolean,
	): readonly DeckZoneSection[] {
		if (!zone) {
			return null;
		}

		const result = zone.sections.map((section) => {
			const quantitiesLeftForCard = this.buildQuantitiesLeftForCard(section.cards, collection);
			const grouped: { [cardId: string]: readonly VisualDeckCard[] } = groupByFunction((card: VisualDeckCard) =>
				this.buildGroupingKey(
					card,
					quantitiesLeftForCard,
					showStatsChange,
					showGiftsSeparately,
					showBottomCardsSeparately,
					showTopCardsSeparately,
					collection,
				),
			)(section.cards);
			let cards = Object.keys(grouped)
				.map((groupingKey) => {
					const cards = grouped[groupingKey];
					const creatorCardIds: readonly string[] = [
						...new Set(
							cards
								.map((card) => card.creatorCardIds)
								.reduce((a, b) => a.concat(b), [])
								.filter((creator) => creator),
						),
					];

					const result = Object.assign(new VisualDeckCard(), cards[0], {
						totalQuantity: cards.length,
						creatorCardIds: creatorCardIds,
						isMissing: groupingKey.includes('missing'),
					} as VisualDeckCard);
					return result;
				})
				.sort((a, b) => this.compare(a, b, showUpdatedCost))
				.sort((a, b) => this.sortByIcon(a, b));
			if (section.sortingFunction) {
				cards = [...cards].sort(section.sortingFunction);
			}
			return {
				header: section.header,
				cards: cards,
				sortingFunction: section.sortingFunction,
			} as DeckZoneSection;
		});
		return result;
	}

	private buildQuantitiesLeftForCard(cards: readonly VisualDeckCard[], collection: readonly SetCard[]) {
		if (!collection?.length) {
			return {};
		}

		const result = {};
		for (const card of cards) {
			const cardInCollection = collection.find((c) => c.id === card.cardId);
			result[card.cardId] = cardInCollection?.getTotalOwned() ?? 0;
		}
		return result;
	}

	private buildGroupingKey(
		card: VisualDeckCard,
		quantitiesLeftForCard: { [cardId: string]: number },
		showStatsChange: boolean,
		showGiftsSeparately: boolean,
		showBottomCardsSeparately: boolean,
		showTopCardsSeparately: boolean,
		collection: readonly SetCard[],
	): string {
		const keyWithBonus = showStatsChange ? card.cardId + '_' + (card.mainAttributeChange || 0) : card.cardId;
		const keyWithGift = showGiftsSeparately
			? keyWithBonus + 'creators-' + (card.creatorCardIds || []).reduce((a, b) => a + b, '')
			: keyWithBonus;
		const keyWithBottom = showBottomCardsSeparately
			? keyWithGift + 'bottom-' + (card.positionFromBottom ?? '')
			: keyWithGift;
		const keyWithTop = showTopCardsSeparately
			? keyWithBottom + 'top-' + (card.positionFromTop ?? '')
			: keyWithBottom;
		const keyWithGraveyard = card.zone === 'GRAVEYARD' ? keyWithTop + '-graveyard' : keyWithTop;
		const keyWithCost = keyWithGraveyard + '-' + card.getEffectiveManaCost();
		const relatedCardIds = card.relatedCardIds?.join('#') ?? '';
		const keyWithRelatedCards = keyWithCost + '-' + relatedCardIds;
		if (!collection?.length) {
			return keyWithRelatedCards;
		}

		const quantityToAllocate = quantitiesLeftForCard[card.cardId];
		quantitiesLeftForCard[card.cardId] = quantityToAllocate - 1;
		if (quantityToAllocate > 0) {
			return keyWithRelatedCards;
		}

		return keyWithRelatedCards + '-missing';
	}

	private compare(a: VisualDeckCard, b: VisualDeckCard, showUpdatedCost: boolean): number {
		if (this.getCost(a, showUpdatedCost) < this.getCost(b, showUpdatedCost)) {
			return -1;
		}
		if (this.getCost(a, showUpdatedCost) > this.getCost(b, showUpdatedCost)) {
			return 1;
		}
		if (a.cardName?.toLowerCase() < b.cardName?.toLowerCase()) {
			return -1;
		}
		if (a.cardName?.toLowerCase() > b.cardName?.toLowerCase()) {
			return 1;
		}
		if (a.creatorCardIds.length === 0) {
			return -1;
		}
		if (b.creatorCardIds.length === 0) {
			return 1;
		}
		return 0;
	}

	private getCost(card: VisualDeckCard, showUpdatedCost: boolean): number {
		return showUpdatedCost ? card.getEffectiveManaCost() : card.manaCost;
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
