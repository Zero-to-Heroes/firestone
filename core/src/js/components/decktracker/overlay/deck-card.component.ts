import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';

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
			[ngClass]="{ 'color-mana-cost': _colorManaCost, 'color-class-cards': _colorClassCards }"
			[cardTooltip]="cardId"
			[cardTooltipPosition]="_tooltipPosition"
		>
			<div class="background-image" [style.background-image]="cardImage"></div>
			<div class="gradiant"></div>
			<div class="mana-cost">
				<span>{{ manaCost === undefined ? '?' : manaCost }}</span>
			</div>
			<div class="card-name">
				<span>{{ cardName || 'Unkown card' }}</span>
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
			<div
				class="icon-symbol graveyard"
				*ngIf="isGraveyard"
				[helpTooltip]="'In graveyard'"
				[bindTooltipToGameWindow]="true"
			>
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_graveyard" />
						</svg>
					</i>
				</div>
			</div>
			<div
				class="icon-symbol discard"
				*ngIf="isDiscarded"
				[helpTooltip]="'Card discarded'"
				[bindTooltipToGameWindow]="true"
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
				class="icon-symbol trasnformed"
				*ngIf="isTransformed"
				[helpTooltip]="'Card transformed'"
				[bindTooltipToGameWindow]="true"
			>
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_transformed" />
						</svg>
					</i>
				</div>
			</div>
			<div
				class="gift-symbol"
				*ngIf="creatorCardIds && creatorCardIds.length > 0"
				[helpTooltip]="giftTooltip"
				[bindTooltipToGameWindow]="true"
			>
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
			<div class="dim-overlay" *ngIf="highlight === 'dim'"></div>
			<div class="mouse-over"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckCardComponent {
	_tooltipPosition: CardTooltipPositionType;
	cardId: string;
	cardImage: string;
	manaCost: number;
	cardName: string;
	rarity: string;
	numberOfCopies: number;
	highlight: string;
	_colorManaCost: boolean;
	_colorClassCards: boolean;
	cardClass: string;
	creatorCardIds: readonly string[];
	giftTooltip: string;
	isBurned: boolean;
	isDiscarded: boolean;
	isGraveyard: boolean;
	isTransformed: boolean;

	// I don't know why I need the cdr.detectChanges() here. Maybe some async stuff shenanigans?
	constructor(private readonly cdr: ChangeDetectorRef, private readonly cards: AllCardsService) {}

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		// console.log('[deck-card] setting tooltip position', value);
		this._tooltipPosition = value;
		this.cdr.detectChanges();
	}

	@Input('card') set card(card: VisualDeckCard) {
		this.cardId = card.cardId;
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${card.cardId}.jpg)`;
		this.manaCost = card.manaCost;
		this.cardName = card.cardName;
		this.numberOfCopies = card.totalQuantity;
		this.rarity = card.rarity;
		this.creatorCardIds = card.creatorCardIds;
		this.giftTooltip = null;
		this.updateGiftTooltip();
		this.highlight = card.highlight;
		this.isBurned = card.zone === 'BURNED';
		this.isDiscarded = card.zone === 'DISCARD';
		this.isGraveyard = card.zone === 'GRAVEYARD';
		this.isTransformed = card.zone === 'TRANSFORMED_INTO_OTHER';

		this.cardClass = card.cardClass ? card.cardClass.toLowerCase() : null;
		// console.log('setting card highlight', this.cardId, this.highlight, card);
		// 0 is acceptable when showing the deck as a single deck list
		if (this.numberOfCopies < 0) {
			console.error('invalid number of copies', card);
		}
		// Preload
		if (this.cardId) {
			const imageUrl = `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/${this.cardId}.png`;
			const image = new Image();
			// image.onload = () => console.log('[image-preloader] preloaded image', imageUrl);
			image.src = imageUrl;
		}
		this.cdr.detectChanges();
	}

	@Input() set colorManaCost(value: boolean) {
		this._colorManaCost = value;
		this.cdr.detectChanges();
	}

	@Input() set colorClassCards(value: boolean) {
		this._colorClassCards = value;
		this.cdr.detectChanges();
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
				if (!(this.cdr as ViewRef).destroyed) {
					this.cdr.detectChanges();
				}
			}
		} else if (this.creatorCardIds && this.creatorCardIds.length > 1) {
			this.giftTooltip = `Created by <br /> multiple entities`;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		}
	}
}
