import { Component, NgZone, Input, SimpleChanges, Directive, ElementRef, HostListener } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import * as Raven from 'raven-js';
import { NgxPopperModule } from 'ngx-popper';

import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';

import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'card-view',
	styleUrls: [`../../../css/component/collection/card.component.scss`],
	template: `
		<div class="card-container" [ngClass]="{'missing': card.ownedNonPremium + card.ownedPremium == 0}">
			<img src="{{'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/cardbacks/blurred_cardback.png'}}" class="placeholder" *ngIf="showPlaceholder"/>
			<img src="{{image()}}" class="real-card" (load)="imageLoadedHandler()" [hidden]="showPlaceholder"/>
			<div class="count" *ngIf="!showPlaceholder">
				<div class="non-premium" *ngIf="card.ownedNonPremium > 0 || showCounts">
					<span>{{card.ownedNonPremium}}</span>
				</div>
				<div class="premium" *ngIf="card.ownedPremium > 0 || showCounts">
					<i class="gold-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves"/>
						</svg>
					</i>
					<span>{{card.ownedPremium}}</span>
					<i class="gold-theme right">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves"/>
						</svg>
					</i>
				</div>
			</div>
		</div>
	`,
})
// 7.1.1.17994
export class CardComponent {

	@Input() public card: SetCard;
	@Input() public tooltips = true;
	@Input() public showCounts = false;

	private showPlaceholder = true;

	constructor(
		private el: ElementRef,
		private events: Events,
		private cards: AllCardsService) {
		// console.log('constructor CollectionComponent');
	}

	@HostListener('click') onClick() {
		if (this.tooltips) {
			this.events.broadcast(Events.SHOW_CARD_MODAL, this.card.id);
		}
	}

	@HostListener('mouseenter') onMouseEnter() {
		if (this.tooltips) {
			// console.log('mouseenter', this.card, this.el.nativeElement.getBoundingClientRect());
			let rect = this.el.nativeElement.getBoundingClientRect();
			let x = rect.left + rect.width - 20;
			let y = rect.top + rect.height / 2;
			this.events.broadcast(Events.SHOW_TOOLTIP, this.card.id, x, y);
		}
	}

	@HostListener('mouseleave') onMouseLeave() {
		if (this.tooltips) {
			// console.log('hiding tooltip', this.cardId);
			this.events.broadcast(Events.HIDE_TOOLTIP, this.card.id);
		}
	}

	private image() {
		return 'http://static.zerotoheroes.com/hearthstone/fullcard/en/256/' + this.card.id + '.png';
	}

	private imageLoadedHandler() {
		this.showPlaceholder = false;
	}
}
