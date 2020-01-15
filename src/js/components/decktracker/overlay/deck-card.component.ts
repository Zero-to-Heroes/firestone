import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
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
			class="deck-card {{ rarity }} {{ highlight }}"
			[ngClass]="{ 'color-mana-cost': _colorManaCost }"
			[cardTooltip]="cardId"
			[cardTooltipPosition]="_tooltipPosition"
		>
			<div class="background-image" [style.background-image]="cardImage"></div>
			<div class="gradiant"></div>
			<div class="mana-cost">
				<span>{{ manaCost === undefined ? '?' : manaCost }}</span>
			</div>
			<div class="card-name">
				<span>{{ cardName }}</span>
			</div>
			<div class="number-of-copies" *ngIf="numberOfCopies > 1">
				<div class="inner-border">
					<span>{{ numberOfCopies }}</span>
				</div>
			</div>
			<div class="gift-symbol" *ngIf="creatorCardIds && creatorCardIds.length > 0">
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
	creatorCardIds: readonly string[];

	// I don't know why I need the cdr.detectChanges() here. Maybe some async stuff shenanigans?
	constructor(private readonly cdr: ChangeDetectorRef) {}

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
		this.highlight = card.highlight;
		console.log('setting card highlight', this.cardId, this.highlight, card);
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
}
