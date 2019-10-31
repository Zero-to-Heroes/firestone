import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnDestroy,
	Renderer2,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { Events } from '../../../services/events.service';

@Component({
	selector: 'deck-card',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/deck-card.component.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
	],
	template: `
		<div class="deck-card {{ rarity }} {{ highlight }}">
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
			<div class="dim-overlay" *ngIf="highlight === 'dim' || (_activeTooltip && _activeTooltip !== cardId)"></div>
			<div class="mouse-over" #mouseOverElement></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckCardComponent implements AfterViewInit, OnDestroy {
	@ViewChild('mouseOverElement', { static: true })
	private mouseOverElement: ElementRef;

	_activeTooltip: string;
	cardId: string;
	cardImage: string;
	manaCost: number;
	cardName: string;
	rarity: string;
	numberOfCopies: number;
	highlight: string;
	creatorCardIds: readonly string[];

	private enterTimestamp: number;
	private mouseEnterListener;
	private mouseLeaveListener;

	@Input('activeTooltip') set activeTooltip(activeTooltip: string) {
		this._activeTooltip = activeTooltip;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
		// console.log('setting active tooltip', this.cardId, this._activeTooltip);
	}

	@Input('card') set card(card: VisualDeckCard) {
		this.cardId = card.cardId;
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${card.cardId}.jpg)`;
		this.manaCost = card.manaCost;
		this.cardName = card.cardName;
		this.numberOfCopies = card.totalQuantity;
		this.rarity = card.rarity;
		this.creatorCardIds = card.creatorCardIds;
		this.highlight = card instanceof VisualDeckCard ? (card as VisualDeckCard).highlight : undefined;
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
	}

	constructor(
		private el: ElementRef,
		private cdr: ChangeDetectorRef,
		private events: Events,
		private renderer: Renderer2,
	) {}

	ngAfterViewInit() {
		this.mouseEnterListener = this.renderer.listen(this.mouseOverElement.nativeElement, 'mouseenter', () => {
			// console.log('sending tooltip event');
			const rect = this.el.nativeElement.getBoundingClientRect();
			this.events.broadcast(Events.DECK_SHOW_TOOLTIP, this.cardId, rect.left, rect.top, true, rect);
		});
		this.mouseLeaveListener = this.renderer.listen(this.mouseOverElement.nativeElement, 'mouseleave', () => {
			// console.log('sending hide tooltip event');
			this.events.broadcast(Events.DECK_HIDE_TOOLTIP);
		});
	}

	ngOnDestroy() {
		this.mouseEnterListener();
		this.mouseLeaveListener();
	}

	// @HostListener('mouseenter') onMouseEnter() {
	// 	// console.log('mouse enter', this.cardId);
	// 	this.enterTimestamp = Date.now();
	// 	const rect = this.el.nativeElement.getBoundingClientRect();
	// 	this.events.broadcast(Events.DECK_SHOW_TOOLTIP, this.cardId, rect.left, rect.top, true, rect);
	// }

	// // We want to show the tooltip only if we see the user really keeps their mouse
	// // over the card
	// @HostListener('mousemove') onMouseOver(event) {
	// 	// console.log('mousing move');
	// 	if (this.enterTimestamp && Date.now() - this.enterTimestamp > 400) {
	// 		// console.log('showing tooltip');
	// 		this.enterTimestamp = undefined;
	// 		const rect = this.el.nativeElement.getBoundingClientRect();
	// 		this.events.broadcast(Events.DECK_SHOW_TOOLTIP, this.cardId, rect.left, rect.top, true, rect);
	// 	}
	// }

	// @HostListener('mouseleave')
	// onMouseLeave() {
	// 	// console.log('mouse leave', this.cardId);
	// 	this.enterTimestamp = undefined;
	// 	this.events.broadcast(Events.DECK_HIDE_TOOLTIP);
	// }
}
