import { Component, NgZone, Input, SimpleChanges, Directive, ElementRef, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { DomSanitizer } from '@angular/platform-browser';

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
			<img src="/Files/assets/images/placeholder.png" class="pale-theme placeholder" [@showPlaceholder]="showPlaceholder" />

			<img src="{{image()}}" class="real-card" (load)="imageLoadedHandler()" [@showRealCard]="!showPlaceholder"/>
			<div class="count" *ngIf="!showPlaceholder">
				<div class="non-premium" *ngIf="card.ownedNonPremium > 0 || showCounts">
					<span>{{card.ownedNonPremium}}</span>
				</div>
				<div class="premium" *ngIf="card.ownedPremium > 0 || showCounts">
					<i class="gold-theme left">
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

	@Input() public card: SetCard;
	@Input() public tooltips = true;
	@Input() public showCounts = false;

	showPlaceholder = true;

	constructor(
		private el: ElementRef,
		private events: Events,
		private cdr: ChangeDetectorRef,
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
			// console.log('how many collected cards?', this.card.isOwned());
			this.events.broadcast(Events.SHOW_TOOLTIP, this.card.id, x, y, this.card.isOwned());
		}
	}

	@HostListener('mouseleave') onMouseLeave() {
		if (this.tooltips) {
			// console.log('hiding tooltip', this.cardId);
			this.events.broadcast(Events.HIDE_TOOLTIP, this.card.id);
		}
	}

	image() {
		return 'http://static.zerotoheroes.com/hearthstone/fullcard/en/256/' + this.card.id + '.png';
	}

	imageLoadedHandler() {
		this.showPlaceholder = false;
		this.cdr.detectChanges();
	}
}
