import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Optional,
	Output,
	ViewRef,
} from '@angular/core';
import { CardClass, CardIds, GameType, ReferenceCard } from '@firestone-hs/reference-data';
import { CardMousedOverService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, uuidShort } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { auditTime, BehaviorSubject, combineLatest, distinctUntilChanged, filter, Observable, takeUntil } from 'rxjs';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { AdService } from '../../../services/ad.service';
import { relatedCardIdsSelectorSort } from '../../../services/decktracker/card-highlight/card-id-selector-sort';
import { Handler, SelectorOutput } from '../../../services/decktracker/card-highlight/cards-highlight-common.service';
import { CARDS_TO_HIGHLIGHT_INSIDE_RELATED_CARDS_WITHOUT_DUPES } from '../../../services/decktracker/card-highlight/merged-highlights';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'deck-card',
	styleUrls: [
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
		'../../../../../../../../shared/common/view/src/lib/components/card/card-tile-background.scss',
		'../../../../css/component/decktracker/overlay/deck-card.component.scss',
	],
	template: `
		<div
			tabindex="0"
			[attr.aria-label]="cardName"
			[attr.entityId]="entityId"
			class="deck-card {{ rarity }} {{ highlight }} {{ cardClass }} {{ linkedCardHighlight }}"
			*ngIf="!isUnknownCard || _showUnknownCards"
			[ngClass]="{
				'color-mana-cost': _colorManaCost,
				'color-class-cards': _colorClassCards,
				missing: _isMissing,
				'linked-card': linkedCardHighlight,
				'old-style': !useNewCardTileStyle
			}"
			[cardTooltip]="cardId"
			[cardTooltipPosition]="'auto'"
			[cardTooltipShowRelatedCards]="_showRelatedCards"
			[cardTooltipRelatedCardIds]="relatedCardIds"
			[cardTooltipForceMouseOver]="forceMouseOver$ | async"
			(mouseenter)="onMouseEnter($event)"
			(mouseleave)="onMouseLeave($event)"
			(click)="onCardClicked($event)"
		>
			<div class="card-info">
				<div class="gradiant-container">
					<div class="gradiant-image" [style.--card-image-url]="'url(' + cardImage + ')'"></div>
				</div>
				<div class="card-image-container">
					<img
						[src]="cardImage"
						class="card-image"
						(error)="onCardImageError()"
						*ngIf="cardId && !cardImageError"
					/>
					<div class="card-image-overlay"></div>
				</div>
				<div
					class="icon-symbol"
					*ngIf="isBurned"
					[helpTooltip]="'decktracker.card-burned' | owTranslate"
					[bindTooltipToGameWindow]="true"
				>
					<div class="inner-border">
						<div class="svg-container" inlineSVG="assets/svg/card_burned.svg"></div>
					</div>
				</div>
				<div
					class="icon-symbol transformed"
					*ngIf="isTransformed"
					[helpTooltip]="'decktracker.card-transformed' | owTranslate"
				>
					<div class="inner-border">
						<div class="svg-container" inlineSVG="assets/svg/card_transformed.svg"></div>
					</div>
				</div>
				<div
					class="gift-symbol"
					*ngIf="creatorCardIds && creatorCardIds.length > 0"
					[helpTooltip]="giftTooltip"
				>
					<div class="inner-border">
						<div class="svg-container" inlineSVG="assets/svg/card_gift.svg"></div>
					</div>
				</div>
				<div class="stolen-symbol" *ngIf="isStolen" [helpTooltip]="'decktracker.stolen-tooltip' | fsTranslate">
					<div class="inner-border">
						<div class="svg-container" inlineSVG="assets/svg/card_stolen.svg"></div>
					</div>
				</div>
				<div
					class="icon-symbol dredged"
					*ngIf="isDredged"
					[helpTooltip]="'decktracker.card-dredged-tooltip' | owTranslate"
				>
					<div class="inner-border">
						<div class="icon svg-container" inlineSVG="assets/svg/dredged.svg"></div>
					</div>
				</div>
				<div class="legendary-symbol" *ngIf="rarity === 'legendary'">
					<div class="inner-border">
						<div class="svg-container" inlineSVG="assets/svg/card_legendary.svg"></div>
					</div>
				</div>
				<div
					class="icon-symbol discard"
					*ngIf="isDiscarded"
					[helpTooltip]="'decktracker.card-discarded' | owTranslate"
				>
					<div class="inner-border">
						<div class="svg-container" inlineSVG="assets/svg/card_discarded.svg"></div>
					</div>
				</div>
				<div
					class="icon-symbol countered"
					*ngIf="isCountered"
					[helpTooltip]="'decktracker.card-countered' | owTranslate"
				>
					<div class="inner-border">
						<div class="svg-container" inlineSVG="assets/svg/card_burned.svg"></div>
					</div>
				</div>
				<div
					class="icon-symbol graveyard"
					*ngIf="isGraveyard"
					[helpTooltip]="'decktracker.card-in-graveyard' | owTranslate"
				>
					<div class="inner-border">
						<div class="svg-container" inlineSVG="assets/svg/card_graveyard.svg"></div>
					</div>
				</div>
				<div class="number-of-copies" *ngIf="numberOfCopies > 1">
					<div class="inner-border">
						<span>{{ numberOfCopies }}</span>
					</div>
				</div>
			</div>
			<div class="mana-cost" [ngClass]="{ 'cost-reduction': manaCostReduction }">
				<span>{{ manaCostStr }}</span>
			</div>
			<div class="missing-overlay" *ngIf="_isMissing"></div>
			<div class="card-name">
				<span>{{ cardName }}</span>
			</div>
			<div class="dim-overlay" *ngIf="highlight === 'dim'"></div>
			<div class="linked-card-overlay"></div>
			<div class="mouse-over" [style.right.px]="mouseOverRight"></div>
		</div>
		<deck-card
			*ngIf="transformedInto && _showTransformedInto"
			[card]="transformedInto"
			class="transformed-into-card"
			[colorManaCost]="_colorManaCost"
			[showRelatedCards]="_showRelatedCards"
			[side]="_side"
		></deck-card>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckCardComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	forceMouseOver$: Observable<boolean>;

	@Output() cardClicked: EventEmitter<VisualDeckCard> = new EventEmitter<VisualDeckCard>();

	@Input() set showUpdatedCost(value: boolean) {
		this.showUpdatedCost$$.next(value);
	}

	@Input() set showStatsChange(value: boolean) {
		this.showStatsChange$$.next(value);
	}

	@Input() set card(card: VisualDeckCard) {
		this.card$$.next(card);
	}

	@Input() set groupSameCardsTogether(value: boolean) {
		this.groupSameCardsTogether$$.next(value);
	}

	@Input() set colorManaCost(value: boolean) {
		this._colorManaCost = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set showRelatedCards(value: boolean) {
		this._showRelatedCards = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set showTransformedInto(value: boolean) {
		this._showTransformedInto = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set colorClassCards(value: boolean) {
		this._colorClassCards = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set showUnknownCards(value: boolean) {
		this._showUnknownCards = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set zone(zone: DeckZone) {
		this._zone = zone;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set side(value: 'player' | 'opponent' | 'single') {
		this._side = value;
		this.registerHighlight();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() removeDuplicatesInTooltip: boolean;
	@Input() gameTypeOverride: GameType | null = null;

	cardId: string;
	entityId: number;
	cardImage: string;
	manaCost: number;
	manaCostStr: string;
	cardName: string;
	rarity: string;
	numberOfCopies: number;
	positionFromBottom: number;
	positionFromTop: number;
	highlight: string;
	linkedCardHighlight: boolean | string;
	_colorManaCost: boolean;
	_colorClassCards: boolean;
	_showRelatedCards: boolean;
	_showTransformedInto: boolean;
	_isMissing: boolean;
	cardClass: string;
	creatorCardIds: readonly string[];
	relatedCardIds: readonly string[];
	giftTooltip: string;
	isBurned: boolean;
	isDiscarded: boolean;
	isCountered: boolean;
	isGraveyard: boolean;
	isTransformed: boolean;
	transformedInto: VisualDeckCard;
	isDredged: boolean;
	isStolen: boolean;
	manaCostReduction: boolean;
	mouseOverRight = 0;
	_showUnknownCards = true;
	isUnknownCard: boolean;
	_side: 'player' | 'opponent' | 'single';

	useNewCardTileStyle = false;
	cardImageError = false;

	private _referenceCard: ReferenceCard;
	private _uniqueId: string;
	private _zone: DeckZone;

	private showUpdatedCost$$ = new BehaviorSubject<boolean>(false);
	private showStatsChange$$ = new BehaviorSubject<boolean>(false);
	private card$$ = new BehaviorSubject<VisualDeckCard | null>(null);
	private groupSameCardsTogether$$ = new BehaviorSubject<boolean>(false);
	private forceMouseOver$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly cards: CardsFacadeService,
		private readonly el: ElementRef,
		private readonly cardMouseOverService: CardMousedOverService,
		private readonly ads: AdService,
		private readonly prefs: PreferencesService,
		@Optional() private readonly cardsHighlightService: CardsHighlightFacadeService,
		@Optional() private readonly i18n: LocalizationFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.cardMouseOverService, this.ads, this.prefs);

		this.forceMouseOver$ = this.forceMouseOver$$.pipe(this.mapData((value) => value));

		this.prefs.preferences$$
			.pipe(
				this.mapData((prefs) => prefs.useNewCardTileStyle),
				distinctUntilChanged(),
			)
			.subscribe((useNewCardTileStyle) => {
				this.useNewCardTileStyle = useNewCardTileStyle;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});

		combineLatest([
			this.card$$.pipe(this.mapData((c) => c)),
			this.showUpdatedCost$$,
			this.showStatsChange$$,
			this.groupSameCardsTogether$$,
		])
			.pipe(
				filter(([card]) => !!card),
				auditTime(50),
				takeUntil(this.destroyed$),
			)
			.subscribe(([card, showUpdatedCost, showStatsChange, groupSameCardsTogether]) => {
				this.updateInfos(card, showUpdatedCost, showStatsChange, groupSameCardsTogether);
			});

		// TODO: why have this in the deck card component? This means that when the display options don't show the currently
		// moused over card, we won't get any highlight? (like hero power highlights, or discovery highlights when the DIscovery zone
		// is not shown)
		// combineLatest([this.ads.enablePremiumFeatures$$, this.cardMouseOverService.mousedOverCard$$])
		// 	.pipe(
		// 		// HDT offers this for free
		// 		// filter(([enablePremiumFeatures]) => enablePremiumFeatures),
		// 		map(([enablePremiumFeatures, mousedOverCard]) => mousedOverCard),
		// 		distinctUntilChanged(
		// 			(a, b) => a?.EntityId === b?.EntityId && a?.Zone === b?.Zone && a?.Side === b?.Side,
		// 		),
		// 		pairwise(),
		// 		takeUntil(this.destroyed$),
		// 	)
		// 	.subscribe(([previousMouseOverCard, mousedOverCard]) => {
		// 		console.debug('[meta] [bgs] mouse over card', previousMouseOverCard, mousedOverCard);
		// 		if (!this.entityId) {
		// 			return;
		// 		}
		// 		if (mousedOverCard?.Side === Side.OPPOSING && this._side === 'player') {
		// 			return;
		// 		}
		// 		if (mousedOverCard?.Side === Side.FRIENDLY && this._side === 'opponent') {
		// 			return;
		// 		}

		// 		// We use cardId instead of entityId so that it still works when we have multiple cards in hand (since only one entity
		// 		// id is assigned)
		// 		if (mousedOverCard?.CardId === this.cardId) {
		// 			this.onMouseEnter(null);
		// 			// Not sure we actually want this, as it could start to show up too often and
		// 			// get annoying
		// 			// this.forceMouseOver$$.next(true);
		// 		} else if (previousMouseOverCard?.CardId === this.cardId) {
		// 			this.onMouseLeave(null);
		// 			// this.forceMouseOver$$.next(false);
		// 		}
		// 	});
		this.forceMouseOver$$.pipe(this.mapData((value) => value)).subscribe((value) => {
			if (value) {
				this.onMouseEnter(null);
			} else {
				this.onMouseLeave(null);
			}
		});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	registerHighlight() {
		if (!this._side) {
			return;
		}

		this._uniqueId = uuidShort();
		this.cardsHighlightService?.register(
			this._uniqueId,
			{
				referenceCardProvider: () => this._referenceCard,
				deckCardProvider: () => this.card$$.value,
				zoneProvider: () => this._zone,
				side: () => this._side,
				highlightCallback: (highlight: SelectorOutput) => this.doHighlight(highlight),
				unhighlightCallback: () => this.doUnhighlight(),
				debug: this,
			} as Handler,
			this._side,
		);
		// console.debug('registering highlight', card?.cardId, this.el.nativeElement);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		// console.debug('unregistering highlight', card?.cardName, this.el.nativeElement);
		this.cardsHighlightService?.onMouseLeave(this.cardId);
		this.cardsHighlightService?.unregister(this._uniqueId, this._side);
	}

	doHighlight(highlight: SelectorOutput) {
		this.linkedCardHighlight = highlight === true ? true : highlight === false ? false : 'linked-card-' + highlight;
		// console.debug('highlight', this.cardName, this.cardId, highlight, this.linkedCardHighlight);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	doUnhighlight() {
		this.linkedCardHighlight = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseEnter(event: MouseEvent) {
		this.cardsHighlightService?.onMouseEnter(this.cardId, this._side, this.card$$.value);

		const globalHighlights = this.cardsHighlightService?.getGlobalRelatedCards(
			this.entityId,
			this.cardId,
			this._side,
			this.gameTypeOverride,
		);
		// console.debug('globalHighlights', this.cardId, globalHighlights);
		if (!!globalHighlights?.length) {
			const sort = relatedCardIdsSelectorSort(this.cardId, this.cards);
			this.relatedCardIds = sort == null ? globalHighlights : [...globalHighlights].sort(sort);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return globalHighlights;
		}

		const cardsToShow = this.cardsHighlightService?.getCardsForTooltip(this.cardId, this._side, this.card$$.value);
		// console.debug('cardsToShow', this.cardId, cardsToShow);
		if (!cardsToShow?.length) {
			return;
		}
		this.relatedCardIds = cardsToShow
			.flatMap((info) => ({
				cardId: info.cardId,
				timing: info.playTiming,
			}))
			.sort((a, b) => a.timing - b.timing)
			.map((info) => info.cardId);
		if (
			this.removeDuplicatesInTooltip ||
			CARDS_TO_HIGHLIGHT_INSIDE_RELATED_CARDS_WITHOUT_DUPES.includes(this.cardId as CardIds)
		) {
			this.relatedCardIds = [...new Set(this.relatedCardIds)];
		}
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseLeave(event: MouseEvent) {
		this.cardsHighlightService?.onMouseLeave(this.cardId);
	}

	onCardClicked(event: MouseEvent) {
		this.cardClicked.next(this.card$$.value);
	}

	onCardImageError() {
		this.cardImageError = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async updateInfos(
		card: VisualDeckCard,
		showUpdatedCost: boolean,
		showStatsChange: boolean,
		groupSameCardsTogether: boolean,
	) {
		this.cardId = card.cardId;
		this.entityId = card.entityId;
		this._referenceCard = this.cardId ? this.cards.getCard(this.cardId) : null;
		this.cardImage = `https://static.zerotoheroes.com/hearthstone/cardart/tiles/${card.cardId}.png`;
		// We can't use the reference card cost, because of cards like Zilliax. So we need to make sure that the manaCost field
		// is a strict reflection of the "raw" cost, and the actualManaCost is what gets updated after discounts
		this.manaCost = showUpdatedCost ? card.getEffectiveManaCost() : card.refManaCost;
		this.manaCostStr = this._referenceCard?.hideStats ? '' : this.manaCost == null ? '?' : `${this.manaCost}`;
		this.manaCostReduction = this.manaCost != null && this.manaCost < card.refManaCost;
		this.cardName = this.buildCardName(card, showStatsChange);
		this.isUnknownCard = !card.cardName?.length && !this.cardId;

		this.numberOfCopies = card.totalQuantity;
		this.positionFromTop = card.positionFromTop;
		this.rarity = card.rarity?.toLowerCase() ?? this.cards.getCard(this.cardId)?.rarity?.toLowerCase();
		this.creatorCardIds = card.creatorCardIds;
		this.giftTooltip = null;
		this.updateGiftTooltip();
		this.highlight = card.highlight;
		this.isDredged = card.dredged && !card.zone;
		// For now don't recompute the info dynamically (with the logic from onMouseEnter). If I start getting feedback
		// that this is an issue, I'll revisit
		this.relatedCardIds = this.relatedCardIds ?? card.relatedCardIds;

		this.isBurned = !groupSameCardsTogether && (card.zone === 'BURNED' || card.milled);
		this.isDiscarded = !groupSameCardsTogether && card.zone === 'DISCARD';
		this.isCountered = !groupSameCardsTogether && card.countered;
		this.isGraveyard = !groupSameCardsTogether && card.zone === 'GRAVEYARD';
		this.isTransformed = card.zone === 'TRANSFORMED_INTO_OTHER';
		this.transformedInto = !!card.transformedInto
			? VisualDeckCard.create({
					cardId: card.transformedInto,
					entityId: card.entityId,
					refManaCost: this.cards.getCard(card.transformedInto)?.cost,
					cardName: this.cards.getCard(card.transformedInto)?.name,
					rarity: this.cards.getCard(card.transformedInto)?.rarity?.toLowerCase(),
			  })
			: null;
		this._isMissing = card.isMissing;
		this.isStolen = card.stolenFromOpponent;

		this.cardClass = !!card.classes?.length ? CardClass[card.classes[0]].toLowerCase() : null;

		// 0 is acceptable when showing the deck as a single deck list
		if (this.numberOfCopies < 0) {
			console.error('invalid number of copies', card);
		}
		// Preload
		if (this.cardId) {
			const imageUrl =
				this.i18n?.getCardImage(this.cardId) ??
				`https://static.firestoneapp.com/cards/512/enUS/${this.cardId}.png`;
			const image = new Image();
			image.src = imageUrl;
		}

		if (this.numberOfCopies > 1) {
			this.mouseOverRight += 25;
		}
		if (this.rarity === 'legendary') {
			this.mouseOverRight += 25;
		}
		if (this.creatorCardIds && this.creatorCardIds.length > 0) {
			this.mouseOverRight += 25;
		}
		if (this.isBurned) {
			this.mouseOverRight += 25;
		}
		if (this.isDiscarded) {
			this.mouseOverRight += 25;
		}
		if (this.isCountered) {
			this.mouseOverRight += 25;
		}
		if (this.isGraveyard) {
			this.mouseOverRight += 25;
		}
		if (this.isTransformed) {
			this.mouseOverRight += 25;
		}
		this.mouseOverRight = Math.min(100, this.mouseOverRight);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildCardName(card: VisualDeckCard, showStatsChange: boolean): string {
		let cardName = '';
		if (!!card.cardName?.length) {
			cardName = card.cardName;
		} else if (this._referenceCard?.name?.length) {
			cardName = this._referenceCard.name;
		} else if (!card.creatorCardIds?.length) {
			cardName = this.i18n.getUnknownCardName();
		} else {
			const creatorCardId = card.creatorCardIds[0];
			const creatorName = this.cards.getCard(creatorCardId)?.name;
			cardName = creatorName?.length
				? this.i18n.getCreatedByCardName(creatorName)
				: this.i18n.getUnknownCardName();
		}
		return cardName + this.buildSuffix(card, showStatsChange);
	}

	private buildSuffix(_card: VisualDeckCard, showStatsChange: boolean): string {
		if (_card.mainAttributeChange) {
			console.debug('building suffixt', _card.cardName, _card.mainAttributeChange, showStatsChange);
		}
		let suffix = '';
		if (!showStatsChange) {
			return suffix;
		}
		if (_card.mainAttributeChange) {
			suffix += ` (+${_card.mainAttributeChange})`;
		}
		if (_card.turnsUntilImmolate && _card.zone === 'HAND') {
			suffix += ` (${this.i18n.translateString('decktracker.burns-in', {
				value: _card.turnsUntilImmolate,
			})})`;
		}
		return suffix;
	}

	private updateGiftTooltip() {
		if (this.creatorCardIds && this.creatorCardIds.length === 1) {
			const creatorCard = this.cards.getCard(this.creatorCardIds[0]);
			if (creatorCard) {
				this.giftTooltip = this.i18n.translateString('decktracker.gift-created-by-single-card', {
					value: creatorCard.name,
				});
			}
		} else if (this.creatorCardIds && this.creatorCardIds.length > 1) {
			this.giftTooltip = this.i18n.translateString('decktracker.gift-created-by-single-card', {
				value: this.creatorCardIds.map((cardId) => this.cards.getCard(cardId).name).join(', '),
			});
		}
	}
}
