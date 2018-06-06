import { Component, NgZone, Input, ElementRef, HostListener } from '@angular/core';

import * as Raven from 'raven-js';

import { Events } from '../../services/events.service';

import { SetCard } from '../../models/set';
import { CardHistory } from '../../models/card-history';

declare var overwolf: any;
declare var ga: any;

@Component({
	selector: 'card-history-item',
	styleUrls: [`../../../css/component/collection/card-history-item.component.scss`],
	template: `
		<div class="card-history-item">
			<img class="rarity" src="{{rarityImg()}}" />
			<span class="name">{{cardName()}}</span>
			<span class="dust-amount" *ngIf="!historyItem.isNewCard">
				<span>{{historyItem.dustValue}}</span>
				<i class="i-30 pale-theme">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#dust"/>
					</svg>
				</i>
			</span>
			<span class="new" *ngIf="historyItem.isNewCard">
				<span>New</span>
			</span>
			<span class="date">{{creationDate()}}</span>
		</div>
	`,
})
// 7.1.1.17994
export class CardHistoryItemComponent {

	@Input() historyItem: CardHistory;

	constructor(
		private el: ElementRef,
		private events: Events) {
	}

	@HostListener('click') onClick() {
		this.events.broadcast(Events.SHOW_CARD_MODAL, this.historyItem.cardId);
		this.events.broadcast(Events.HIDE_TOOLTIP, this.historyItem.cardId);
	}

	@HostListener('mouseenter') onMouseEnter() {
		// console.log('mouseenter', this.historyItem, this.el.nativeElement.getBoundingClientRect());
		let rect = this.el.nativeElement.getBoundingClientRect();
		let x = rect.left - rect.width + 120;
		let y = rect.top + rect.height / 2;
		this.events.broadcast(Events.SHOW_TOOLTIP, this.historyItem.cardId, x, y, true);
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		// console.log('hiding tooltip', this.cardId);
		this.events.broadcast(Events.HIDE_TOOLTIP, this.historyItem.cardId);
	}

	private rarityImg() {
		return `/Files/assets/images/rarity/rarity-${this.historyItem.rarity}.png`;
	}

	private creationDate(): string {
		return new Date(this.historyItem.creationTimestamp).toLocaleDateString(
			"en-GB",
			{ day: "2-digit", month: "2-digit", year: "2-digit"} );
	}

	private cardName(): string {
		return (this.historyItem.isPremium ? 'Golden ' : '') + this.historyItem.cardName;
	}
}
