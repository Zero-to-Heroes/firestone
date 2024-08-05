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
import { CardClass, CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { CardMousedOverService, Side } from '@firestone/memory';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, deepEqual, uuidShort } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { combineLatest, distinctUntilChanged, filter, map, pairwise, takeUntil } from 'rxjs';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { AdService } from '../../../services/ad.service';
import { Handler, SelectorOutput } from '../../../services/decktracker/card-highlight/cards-highlight-common.service';
import { CARDS_TO_HIGHLIGHT_INSIDE_RELATED_CARDS_WITHOUT_DUPES } from '../../../services/decktracker/card-highlight/merged-highlights';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'deck-card',
	styleUrls: [
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
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
				'linked-card': linkedCardHighlight
			}"
			[cardTooltip]="cardId"
			[cardTooltipPosition]="'auto'"
			[cardTooltipShowRelatedCards]="_showRelatedCards"
			[cardTooltipRelatedCardIds]="relatedCardIds"
			(mouseenter)="onMouseEnter($event)"
			(mouseleave)="onMouseLeave($event)"
			(click)="onCardClicked($event)"
		>
			<div class="background-image" [style.background-image]="cardImage"></div>
			<div class="mana-cost" [ngClass]="{ 'cost-reduction': manaCostReduction }">
				<span>{{ manaCostStr }}</span>
			</div>
			<div class="missing-overlay" *ngIf="_isMissing"></div>
			<div class="gradiant"></div>
			<div class="card-name">
				<span>{{ cardName }}</span>
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
			<div class="gift-symbol" *ngIf="creatorCardIds && creatorCardIds.length > 0" [helpTooltip]="giftTooltip">
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
			<!-- <div class="position-from-top" *ngIf="positionFromTop">
				<div class="inner-border">
					<span>{{ positionFromTop }}</span>
				</div>
			</div>
			<div class="position-from-bottom" *ngIf="positionFromBottom">
				<div class="inner-border">
					<span>{{ positionFromBottom }}</span>
				</div>
			</div> -->
			<div class="number-of-copies" *ngIf="numberOfCopies > 1">
				<div class="inner-border">
					<span>{{ numberOfCopies }}</span>
				</div>
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
	@Output() cardClicked: EventEmitter<VisualDeckCard> = new EventEmitter<VisualDeckCard>();

	/** @deprecated */
	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		this._tooltipPosition = value;
		this.cdr.detectChanges();
	}

	@Input() set showUpdatedCost(value: boolean) {
		this._showUpdatedCost = value;
		this.updateInfos(true);
	}

	@Input() set showStatsChange(value: boolean) {
		this._showStatsChange = value;
		this.updateInfos(true);
	}

	@Input() set card(card: VisualDeckCard) {
		this._card = card;
		this.updateInfos();
	}

	@Input() set groupSameCardsTogether(value: boolean) {
		this._groupSameCardsTogether = value;
		this.updateInfos(true);
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

	@Input() set side(value: 'player' | 'opponent' | 'duels') {
		this._side = value;
		this.registerHighlight();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_tooltipPosition: CardTooltipPositionType;
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
	_groupSameCardsTogether: boolean;
	_side: 'player' | 'opponent' | 'duels';

	private _showUpdatedCost: boolean;
	private _showStatsChange: boolean;
	private _card: VisualDeckCard;
	private _referenceCard: ReferenceCard;
	private _uniqueId: string;
	private _zone: DeckZone;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly cards: CardsFacadeService,
		private readonly el: ElementRef,
		private readonly cardMouseOverService: CardMousedOverService,
		private readonly ads: AdService,
		@Optional() private readonly cardsHighlightService: CardsHighlightFacadeService,
		@Optional() private readonly i18n: LocalizationFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.cardMouseOverService.isReady();
		await this.ads.isReady();

		combineLatest([this.ads.enablePremiumFeatures$$, this.cardMouseOverService.mousedOverCard$$])
			.pipe(
				filter(([enablePremiumFeatures]) => enablePremiumFeatures),
				map(([enablePremiumFeatures, mousedOverCard]) => mousedOverCard),
				distinctUntilChanged((a, b) => a?.CardId === b?.CardId && a?.Zone === b?.Zone && a?.Side === b?.Side),
				pairwise(),
				takeUntil(this.destroyed$),
			)
			.subscribe(([previousMouseOverCard, mousedOverCard]) => {
				if (!this.cardId) {
					return;
				}
				if (mousedOverCard?.Side === Side.OPPOSING && this._side === 'player') {
					return;
				}
				if (mousedOverCard?.Side === Side.FRIENDLY && this._side === 'opponent') {
					return;
				}

				if (mousedOverCard?.CardId === this.cardId) {
					console.debug('considering mouse over', previousMouseOverCard, mousedOverCard, this.cardId);
					this.onMouseEnter(null);
				} else if (previousMouseOverCard?.CardId === this.cardId) {
					console.debug('considering mouse leave', previousMouseOverCard, mousedOverCard, this.cardId);
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
				deckCardProvider: () => this._card,
				zoneProvider: () => this._zone,
				side: () => this._side,
				highlightCallback: (highlight: SelectorOutput) => this.doHighlight(highlight),
				unhighlightCallback: () => this.doUnhighlight(),
				debug: this,
			} as Handler,
			this._side,
		);
		// console.debug('registering highlight', this._card?.cardId, this.el.nativeElement);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		// console.debug('unregistering highlight', this._card?.cardName, this.el.nativeElement);
		this.cardsHighlightService?.onMouseLeave(this.cardId);
		this.cardsHighlightService?.unregister(this._uniqueId, this._side);
	}

	doHighlight(highlight: SelectorOutput) {
		this.linkedCardHighlight = highlight === true ? true : highlight === false ? false : 'linked-card-' + highlight;
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
		//console.debug('mouse enter', this.cardId, this.cardsHighlightService, this._side, this._card);
		this.cardsHighlightService?.onMouseEnter(this.cardId, this._side, this._card);
		const cardsToShow = this.cardsHighlightService?.getCardsForTooltip(this.cardId, this._side, this._card);
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
		if (CARDS_TO_HIGHLIGHT_INSIDE_RELATED_CARDS_WITHOUT_DUPES.includes(this.cardId as CardIds)) {
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
		this.cardClicked.next(this._card);
	}

	private previousCard: VisualDeckCard;
	private async updateInfos(forceRefresh = false) {
		if (!this._card) {
			return;
		}

		if (!forceRefresh && deepEqual(this._card, this.previousCard)) {
			return;
		}

		this.previousCard = this._card;
		this.cardId = this._card.cardId;
		this.entityId = this._card.entityId;
		this._referenceCard = this.cardId ? this.cards.getCard(this.cardId) : null;
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${this._card.cardId}.jpg)`;
		this.manaCost = this._showUpdatedCost ? this._card.getEffectiveManaCost() : this._card.manaCost;
		this.manaCostStr = this._referenceCard?.hideStats ? '' : this.manaCost == null ? '?' : `${this.manaCost}`;
		this.manaCostReduction = this.manaCost != null && this.manaCost < this._card.manaCost;
		this.cardName =
			(!!this._card.cardName?.length
				? this._card.cardName + this.buildSuffix(this._card)
				: this.i18n.getCardName(this.cardId) ?? this.i18n?.getUnknownCardName()) ??
			this.i18n.getUnknownCardName();
		this.isUnknownCard = !this._card.cardName?.length && !this.cardId;

		this.numberOfCopies = this._card.totalQuantity;
		this.positionFromTop = this._card.positionFromTop;
		this.rarity = this._card.rarity?.toLowerCase() ?? this.cards.getCard(this.cardId)?.rarity?.toLowerCase();
		this.creatorCardIds = this._card.creatorCardIds;
		this.giftTooltip = null;
		this.updateGiftTooltip();
		this.highlight = this._card.highlight;
		this.isDredged = this._card.dredged && !this._card.zone;
		// For now don't recompute the info dynamically (with the logic from onMouseEnter). If I start getting feedback
		// that this is an issue, I'll revisit
		this.relatedCardIds = this._card.relatedCardIds;

		this.isBurned = !this._groupSameCardsTogether && (this._card.zone === 'BURNED' || this._card.milled);
		this.isDiscarded = !this._groupSameCardsTogether && this._card.zone === 'DISCARD';
		this.isCountered = !this._groupSameCardsTogether && this._card.countered;
		this.isGraveyard = !this._groupSameCardsTogether && this._card.zone === 'GRAVEYARD';
		this.isTransformed = this._card.zone === 'TRANSFORMED_INTO_OTHER';
		this.transformedInto = !!this._card.transformedInto
			? VisualDeckCard.create({
					cardId: this._card.transformedInto,
					entityId: this._card.entityId,
					manaCost: this.cards.getCard(this._card.transformedInto)?.cost,
					cardName: this.cards.getCard(this._card.transformedInto)?.name,
					rarity: this.cards.getCard(this._card.transformedInto)?.rarity?.toLowerCase(),
			  })
			: null;
		this._isMissing = this._card.isMissing;
		this.isStolen = this._card.stolenFromOpponent;

		this.cardClass = !!this._card.classes?.length ? CardClass[this._card.classes[0]].toLowerCase() : null;

		// 0 is acceptable when showing the deck as a single deck list
		if (this.numberOfCopies < 0) {
			console.error('invalid number of copies', this._card);
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

	private buildSuffix(_card: VisualDeckCard) {
		if (!this._showStatsChange) {
			return '';
		}
		if (_card.mainAttributeChange) {
			return ` (+${_card.mainAttributeChange})`;
		}
		return '';
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
