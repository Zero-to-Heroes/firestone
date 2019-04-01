import { Component, ChangeDetectionStrategy, Input, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { Events } from '../../../services/events.service';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';

@Component({
	selector: 'deck-card',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/deck-card.component.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
	],
	template: `
		<div class="deck-card {{rarity}} {{highlight}}">
			<div class="background-image" [style.background-image]="cardImage"></div>
			<div class="gradiant"></div>
			<div class="mana-cost"><span>{{manaCost === undefined ? '?' : manaCost}}</span></div>
			<div class="card-name"><span>{{cardName}}</span></div>
			<div class="number-of-copies" *ngIf="numberOfCopies > 1">
				<div class="inner-border">
					<span>{{numberOfCopies}}</span>
				</div>
			</div>
			<div class="legendary-symbol" *ngIf="rarity === 'legendary'">
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="/Files/assets/svg/sprite.svg#legendary_star"/>
						</svg>
					</i>
				</div>
			</div>
			<div class="dim-overlay" *ngIf="highlight === 'dim' || (_activeTooltip && _activeTooltip !== cardId)"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckCardComponent {

	_activeTooltip: string;
	cardId: string;
	cardImage: string;
	manaCost: number;
	cardName: string;
	rarity: string;
	numberOfCopies: number;
	highlight: string;

	constructor(private el: ElementRef, private cdr: ChangeDetectorRef, private events: Events) {

	}

	@Input('activeTooltip') set activeTooltip(activeTooltip: string) {
		this._activeTooltip = activeTooltip;
		this.cdr.detectChanges();
		// console.log('setting active tooltip', this.cardId, this._activeTooltip);
	}

	@Input('card') set card(card: DeckCard) {
		this.cardId = card.cardId;
		this.cardImage = `url(http://static.zerotoheroes.com/hearthstone/cardart/tiles/${card.cardId}.jpg)`;
		this.manaCost = card.manaCost;
		this.cardName = card.cardName;
		this.numberOfCopies = card.totalQuantity;
		this.rarity = card.rarity;
		this.highlight = card instanceof VisualDeckCard ? (card as VisualDeckCard).highlight : undefined;
		// 0 is acceptable when showing the deck as a single deck list
		if (this.numberOfCopies < 0) {
			console.error('invalid number of copies', card);
		}
	}

	@HostListener('click') onMouseEnter() {
		let rect = this.el.nativeElement.getBoundingClientRect();
		let x = rect.left;
		let y = rect.top;
		// console.log('on mouse enter', rect);
		this.events.broadcast(Events.DECK_SHOW_TOOLTIP, this.cardId, x, y, true);
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		this.events.broadcast(Events.DECK_HIDE_TOOLTIP, this.cardId);
	}
}