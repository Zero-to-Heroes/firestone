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
		<div *ngIf="cardId" class="card-container">
			<img src="{{'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/cardbacks/blurred_cardback.png'}}" class="placeholder"/>
			<img src="{{image()}}"/>
			<div class="count">
				{{collected + ' / ' + maxCollectible}}
			</div>
		</div>
	`,
})
// 7.1.1.17994
export class CardComponent {

	@Input() private cardId: string;
	// @Input() private setId: string;
	@Input() private collected: number;
	@Input() private maxCollectible: number;

	constructor(
		private el: ElementRef,
		private events: Events,
		private cards: AllCardsService) {
		// console.log('constructor CollectionComponent');
	}

	@HostListener('mouseenter') onMouseEnter() {
		console.log('mouseenter', this.cardId, this.el.nativeElement.getBoundingClientRect());
		let rect = this.el.nativeElement.getBoundingClientRect();
		let x = rect.left + rect.width - 20;
		let y = rect.top + rect.height / 2;
		this.events.broadcast(Events.SHOW_TOOLTIP, this.cardId, x, y);
	}

	@HostListener('mouseleave') onMouseLeave() {
		// console.log('hiding tooltip', this.cardId);
		this.events.broadcast(Events.HIDE_TOOLTIP, this.cardId);
	}

	// private showTooltip(cardId: string) {
	// 	console.log('showing tooltip', cardId);
	// }

	// private hideTooltip(cardId: string) {
	// 	console.log('hidiing tooltip', cardId);
	// }

	private image() {
		return 'https://s3.amazonaws.com/com.zerotoheroes/plugins/hearthstone/fullcards/en/256/' + this.cardId + '.png';
	}
}
