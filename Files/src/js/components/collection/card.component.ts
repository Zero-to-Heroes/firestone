import { Component,  Input, ElementRef, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';

import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';

import { SetCard } from '../../models/set';

@Component({
	selector: 'card-view',
	styleUrls: [`../../../css/component/collection/card.component.scss`],
	template: `
		<div class="card-container" [ngClass]="{'missing': _card.ownedNonPremium + _card.ownedPremium == 0}">
			<img src="/Files/assets/images/placeholder.png" class="pale-theme placeholder" [@showPlaceholder]="showPlaceholder" />

			<img src="{{image}}" class="real-card" (load)="imageLoadedHandler()" [@showRealCard]="!showPlaceholder"/>
			<div class="count" *ngIf="!showPlaceholder">
				<div class="non-premium" *ngIf="_card.ownedNonPremium > 0 || showCounts">
					<span>{{_card.ownedNonPremium}}</span>
				</div>
				<div class="premium" *ngIf="_card.ownedPremium > 0 || showCounts">
					<i class="gold-theme left">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves"/>
						</svg>
					</i>
					<span>{{_card.ownedPremium}}</span>
					<i class="gold-theme right">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves"/>
						</svg>
					</i>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('showPlaceholder', [
			state('false',	style({
				opacity: 0,
				"pointer-events": "none",
			})),
			state('true',	style({
				opacity: 1,
			})),
			transition(
				'true => false',
				animate(`150ms linear`)),
		]), 
		trigger('showRealCard', [
			state('false',	style({
				opacity: 0,
				"pointer-events": "none",
			})),
			state('true',	style({
				opacity: 1,
			})),
			transition(
				'false => true',
				animate(`150ms linear`)),
		])
	]
})
// 7.1.1.17994
export class CardComponent {

	@Input() public tooltips = true;
	@Input() public showCounts = false;

	showPlaceholder = true;
	image: string;
	_card: SetCard;

	constructor(
		private el: ElementRef,
		private events: Events,
		private cdr: ChangeDetectorRef) {
		// console.log('constructor CollectionComponent');
	}

	@Input('card') set card(card: SetCard) {
		this._card = card;
		this.image = 'http://static.zerotoheroes.com/hearthstone/fullcard/en/256/' + card.id + '.png';
		console.log('setting card in full-card', card, this.image);
	}

	@HostListener('click') onClick() {
		if (this.tooltips) {
			this.events.broadcast(Events.SHOW_CARD_MODAL, this._card.id);
		}
	}

	@HostListener('mouseenter') onMouseEnter() {
		if (this.tooltips) {
			let rect = this.el.nativeElement.getBoundingClientRect();
			let x = rect.left + rect.width - 20;
			let y = rect.top + rect.height / 2;
			this.events.broadcast(Events.SHOW_TOOLTIP, this._card.id, x, y, this._card.isOwned());
		}
	}

	@HostListener('mouseleave') onMouseLeave() {
		if (this.tooltips) {
			this.events.broadcast(Events.HIDE_TOOLTIP, this._card.id);
		}
	}

	imageLoadedHandler() {
		this.showPlaceholder = false;
		this.cdr.detectChanges();
	}
}
