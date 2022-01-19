import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	Optional,
	ViewRef,
} from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { CardsHighlightService } from '../../../services/decktracker/card-highlight/cards-highlight.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { uuid } from '../../../services/utils';

@Component({
	selector: 'deck-card',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
		'../../../../css/component/decktracker/overlay/deck-card.component.scss',
	],
	template: `
		<div
			class="deck-card {{ rarity }} {{ highlight }} {{ cardClass }}"
			[ngClass]="{
				'color-mana-cost': _colorManaCost,
				'color-class-cards': _colorClassCards,
				'missing': _isMissing,
				'linked-card': isLinkedCardHighlight
			}"
			[cardTooltip]="cardId"
			[cardTooltipPosition]="'auto'"
			(mouseenter)="onMouseEnter($event)"
			(mouseleave)="onMouseLeave($event)"
		>
			<div class="background-image" [style.background-image]="cardImage"></div>
			<div class="mana-cost" [ngClass]="{ 'cost-reduction': manaCostReduction }">
				<span>{{ manaCost === undefined ? '?' : manaCost }}</span>
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
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_burned" />
						</svg>
					</i>
				</div>
			</div>
			<div
				class="icon-symbol transformed"
				*ngIf="isTransformed"
				[helpTooltip]="'decktracker.card-transformed' | owTranslate"
			>
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_transformed" />
						</svg>
					</i>
				</div>
			</div>
			<div class="gift-symbol" *ngIf="creatorCardIds && creatorCardIds.length > 0" [helpTooltip]="giftTooltip">
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_gift_icon" />
						</svg>
					</i>
				</div>
			</div>
			<div class="legendary-symbol" *ngIf="rarity === 'legendary'">
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#legendary_star" />
						</svg>
					</i>
				</div>
			</div>
			<div
				class="icon-symbol discard"
				*ngIf="isDiscarded"
				[helpTooltip]="'decktracker.card-discarded' | owTranslate"
			>
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_discarded" />
						</svg>
					</i>
				</div>
			</div>
			<div
				class="icon-symbol graveyard"
				*ngIf="isGraveyard"
				[helpTooltip]="'decktracker.card-in-graveyard' | owTranslate"
			>
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_graveyard" />
						</svg>
					</i>
				</div>
			</div>
			<div class="number-of-copies" *ngIf="numberOfCopies > 1">
				<div class="inner-border">
					<span>{{ numberOfCopies }}</span>
				</div>
			</div>
			<div class="dim-overlay" *ngIf="highlight === 'dim'"></div>
			<div class="linked-card-overlay"></div>
			<div class="mouse-over" [style.right.px]="mouseOverRight"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckCardComponent implements AfterViewInit, OnDestroy {
	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		this._tooltipPosition = value;
		this.cdr.detectChanges();
	}

	@Input() set showUpdatedCost(value: boolean) {
		this._showUpdatedCost = value;
		this.updateInfos();
	}

	@Input() set showStatsChange(value: boolean) {
		this._showStatsChange = value;
		this.updateInfos();
	}

	@Input() set card(card: VisualDeckCard) {
		this._card = card;
		this.updateInfos();
	}

	@Input() set colorManaCost(value: boolean) {
		this._colorManaCost = value;
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

	@Input() set zone(zone: DeckZone) {
		this._zone = zone;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() side: 'player' | 'opponent';

	_tooltipPosition: CardTooltipPositionType;
	cardId: string;
	cardImage: string;
	manaCost: number;
	cardName: string;
	rarity: string;
	numberOfCopies: number;
	highlight: string;
	isLinkedCardHighlight: boolean;
	_colorManaCost: boolean;
	_colorClassCards: boolean;
	_isMissing: boolean;
	cardClass: string;
	creatorCardIds: readonly string[];
	giftTooltip: string;
	isBurned: boolean;
	isDiscarded: boolean;
	isGraveyard: boolean;
	isTransformed: boolean;
	manaCostReduction: boolean;
	mouseOverRight = 0;

	private _showUpdatedCost: boolean;
	private _showStatsChange: boolean;
	private _card: VisualDeckCard;
	private _referenceCard: ReferenceCard;
	private _uniqueId: string;
	private _zone: DeckZone;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly cards: CardsFacadeService,
		@Optional() private readonly cardsHighlightService: CardsHighlightService,
		@Optional() private readonly i18n: LocalizationFacadeService,
	) {}

	ngAfterViewInit() {
		this._uniqueId = uuid();
		this.cardsHighlightService?.register(this._uniqueId, {
			referenceCardProvider: () => this._referenceCard,
			deckCardProvider: () => this._card,
			zoneProvider: () => this._zone,
			highlightCallback: () => this.doHighlight(),
			unhighlightCallback: () => this.doUnhighlight(),
		});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.cardsHighlightService?.unregister(this._uniqueId);
	}

	doHighlight() {
		this.isLinkedCardHighlight = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	doUnhighlight() {
		this.isLinkedCardHighlight = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseEnter(event: MouseEvent) {
		this.cardsHighlightService?.onMouseEnter(this.cardId, this.side, this._card);
	}

	onMouseLeave(event: MouseEvent) {
		this.cardsHighlightService?.onMouseLeave(this.cardId);
	}

	private async updateInfos() {
		if (!this._card) {
			return;
		}

		this.cardId = this._card.cardId;
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${this._card.cardId}.jpg?v=3)`;
		this.manaCost = this._showUpdatedCost ? this._card.getEffectiveManaCost() : this._card.manaCost;
		this.manaCostReduction = this.manaCost != null && this.manaCost < this._card.manaCost;
		this.cardName =
			(!!this._card.cardName?.length
				? this._card.cardName + this.buildSuffix(this._card)
				: this.i18n.getCardName(this.cardId) ?? this.i18n?.getUnknownCardName()) ??
			this.i18n.getUnknownCardName();

		this.numberOfCopies = this._card.totalQuantity;
		this.rarity = this._card.rarity;
		this.creatorCardIds = this._card.creatorCardIds;
		this.giftTooltip = null;
		this.updateGiftTooltip();
		this.highlight = this._card.highlight;

		this.isBurned = this._card.zone === 'BURNED' || this._card.milled;
		this.isDiscarded = this._card.zone === 'DISCARD';
		this.isGraveyard = this._card.zone === 'GRAVEYARD';
		this.isTransformed = this._card.zone === 'TRANSFORMED_INTO_OTHER';
		this._isMissing = this._card.isMissing;

		this.cardClass = this._card.cardClass ? this._card.cardClass.toLowerCase() : null;

		// 0 is acceptable when showing the deck as a single deck list
		if (this.numberOfCopies < 0) {
			console.error('invalid number of copies', this._card);
		}
		// Preload
		if (this.cardId) {
			const imageUrl =
				this.i18n?.getCardImage(this.cardId) ??
				`https://static.firestoneapp.com/cards/512/enUS/${this.cardId}.png?v=3`;
			const image = new Image();
			image.src = imageUrl;
			this._referenceCard = this.cards.getCard(this.cardId);
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
			this.giftTooltip = this.i18n.translateString('decktracker.gift-created-by-multiple-cards');
		}
	}
}
