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
			<img class="rarity" src="{{rarityImg}}" />
			<span class="name">{{cardName}}</span>
			<span class="dust-amount" *ngIf="!newCard">
				<span>{{dustValue}}</span>
				<i class="i-30 pale-theme">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#dust"/>
					</svg>
				</i>
			</span>
			<span class="new" *ngIf="newCard">
				<span>New</span>
			</span>
			<span class="date">{{creationDate}}</span>
		</div>
	`,
})
// 7.1.1.17994
export class CardHistoryItemComponent {

	private cardId: string;
	private newCard: boolean;
	private rarityImg: string;
	private cardName: string;
	private creationDate: string;
	private dustValue: number;

	constructor(
		private el: ElementRef,
		private events: Events) {
	}

	@Input('historyItem') set historyItem(history: CardHistory) {
		this.cardId = history.cardId;
		this.newCard = history.isNewCard;
		this.rarityImg = `/Files/assets/images/rarity/rarity-${history.rarity}.png`;
		this.cardName = (history.isPremium ? 'Golden ' : '') + history.cardName;
		this.dustValue = history.dustValue;
		this.creationDate = new Date(history.creationTimestamp).toLocaleDateString(
			"en-GB",
			{ day: "2-digit", month: "2-digit", year: "2-digit"} );
	}

	@HostListener('click') onClick() {
		this.events.broadcast(Events.SHOW_CARD_MODAL, this.cardId);
		this.events.broadcast(Events.HIDE_TOOLTIP, this.cardId);
	}

	@HostListener('mouseenter') onMouseEnter() {
		let rect = this.el.nativeElement.getBoundingClientRect();
		let x = rect.left - rect.width + 120;
		let y = rect.top + rect.height / 2;
		this.events.broadcast(Events.SHOW_TOOLTIP, this.cardId, x, y, true);
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		// console.log('hiding tooltip', this.cardId);
		this.events.broadcast(Events.HIDE_TOOLTIP, this.cardId);
	}
}
