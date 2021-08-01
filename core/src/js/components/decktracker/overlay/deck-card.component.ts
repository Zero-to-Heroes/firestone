import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { CardsHighlightService } from '../../../services/decktracker/card-highlight/cards-highlight.service';
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
			[cardTooltipPosition]="_tooltipPosition"
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
				<span>{{ cardName || 'Unknown card' }}</span>
			</div>
			<div class="number-of-copies" *ngIf="numberOfCopies > 1">
				<div class="inner-border">
					<span>{{ numberOfCopies }}</span>
				</div>
			</div>
			<div class="icon-symbol" *ngIf="isBurned" [helpTooltip]="'Card burned'" [bindTooltipToGameWindow]="true">
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_burned" />
						</svg>
					</i>
				</div>
			</div>
			<div class="icon-symbol transformed" *ngIf="isTransformed" [helpTooltip]="'Card transformed'">
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
			<div class="icon-symbol discard" *ngIf="isDiscarded" [helpTooltip]="'Card discarded'">
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_discarded" />
						</svg>
					</i>
				</div>
			</div>
			<div class="icon-symbol graveyard" *ngIf="isGraveyard" [helpTooltip]="'In graveyard'">
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_graveyard" />
						</svg>
					</i>
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
		// console.log('[deck-card] setting tooltip position', value);
		this._tooltipPosition = value;
		this.cdr.detectChanges();
	}

	@Input() set showUpdatedCost(value: boolean) {
		this._showUpdatedCost = value;
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
	private _card: VisualDeckCard;
	private _referenceCard: ReferenceCard;
	private _uniqueId: string;
	private _zone: DeckZone;

	// I don't know why I need the cdr.detectChanges() here. Maybe some async stuff shenanigans?
	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly cards: CardsFacadeService,
		private readonly cardsHighlightService: CardsHighlightService,
	) {}

	ngAfterViewInit() {
		this._uniqueId = uuid();
		this.cardsHighlightService.register(this._uniqueId, {
			referenceCardProvider: () => this._referenceCard,
			deckCardProvider: () => this._card,
			zoneProvider: () => this._zone,
			highlightCallback: () => this.doHighlight(),
			unhighlightCallback: () => this.doUnhighlight(),
		});
	}

	ngOnDestroy() {
		this.cardsHighlightService.unregister(this._uniqueId);
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
		this.cardsHighlightService.onMouseEnter(this.cardId);
	}

	onMouseLeave(event: MouseEvent) {
		this.cardsHighlightService.onMouseLeave(this.cardId);
	}

	private async updateInfos() {
		if (!this._card) {
			return;
		}

		this.cardId = this._card.cardId;
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${this._card.cardId}.jpg?v=3)`;
		this.manaCost = this._showUpdatedCost ? this._card.getEffectiveManaCost() : this._card.manaCost;
		this.manaCostReduction = this.manaCost != null && this.manaCost < this._card.manaCost;
		this.cardName = this._card.cardName;
		this.numberOfCopies = this._card.totalQuantity;
		this.rarity = this._card.rarity;
		this.creatorCardIds = this._card.creatorCardIds;
		this.giftTooltip = null;
		this.updateGiftTooltip();
		this.highlight = this._card.highlight;
		// console.log('setting card', this.highlight, card.cardName, card);
		this.isBurned = this._card.zone === 'BURNED' || this._card.milled;
		this.isDiscarded = this._card.zone === 'DISCARD';
		this.isGraveyard = this._card.zone === 'GRAVEYARD';
		this.isTransformed = this._card.zone === 'TRANSFORMED_INTO_OTHER';
		this._isMissing = this._card.isMissing;

		this.cardClass = this._card.cardClass ? this._card.cardClass.toLowerCase() : null;
		// console.log('setting card highlight', this.cardId, this.highlight, card);
		// 0 is acceptable when showing the deck as a single deck list
		if (this.numberOfCopies < 0) {
			console.error('invalid number of copies', this._card);
		}
		// Preload
		if (this.cardId) {
			const imageUrl = `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${this.cardId}.png?v=3`;
			const image = new Image();
			// image.onload = () => console.log('[image-preloader] preloaded image', imageUrl);
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

	private updateGiftTooltip() {
		if (!this.cards.getCards() || this.cards.getCards().length === 0) {
			setTimeout(() => this.updateGiftTooltip(), 200);
			return;
		}
		if (this.creatorCardIds && this.creatorCardIds.length === 1) {
			const creatorCard = this.cards.getCard(this.creatorCardIds[0]);
			if (creatorCard) {
				this.giftTooltip = `Created by <br /> ${creatorCard.name}`;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			}
		} else if (this.creatorCardIds && this.creatorCardIds.length > 1) {
			this.giftTooltip = `Created by <br /> multiple entities`;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}
	}
}
