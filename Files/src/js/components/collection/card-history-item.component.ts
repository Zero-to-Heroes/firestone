import { Component, Input, ElementRef, HostListener, ChangeDetectionStrategy, AfterViewInit, EventEmitter } from '@angular/core';

import { Events } from '../../services/events.service';

import { CardHistory } from '../../models/card-history';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ShowCardDetailsEvent } from '../../services/mainwindow/store/events/collection/show-card-details-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'card-history-item',
	styleUrls: [`../../../css/component/collection/card-history-item.component.scss`],
	template: `
		<div class="card-history-item" [ngClass]="{ 'active': active }" [cardTooltip]="cardId">
			<img class="rarity" src="{{ rarityImg }}" />
			<span class="name">{{ cardName }}</span>
			<span class="dust-amount" *ngIf="!newCard">
				<span>{{ dustValue }}</span>
				<i class="i-30 pale-theme">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#dust" />
					</svg>
				</i>
			</span>
			<span class="new" *ngIf="newCard && (!relevantCount || relevantCount === 1)">
				<span>New</span>
			</span>
			<span class="new second" *ngIf="newCard && relevantCount > 1">
				<span>Second</span>
			</span>
			<span class="date">{{ creationDate }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHistoryItemComponent implements AfterViewInit {
	@Input() active: boolean;

	newCard: boolean;
	relevantCount: number;
	rarityImg: string;
	cardName: string;
	creationDate: string;
	dustValue: number;
	cardId: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private el: ElementRef, private ow: OverwolfService, private events: Events) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	@Input('historyItem') set historyItem(history: CardHistory) {
		if (!history) {
			return;
		}
		this.cardId = history.cardId;
		this.newCard = history.isNewCard;
		this.relevantCount = history.relevantCount;
		this.rarityImg = `/Files/assets/images/rarity/rarity-${history.rarity}.png`;
		this.cardName = (history.isPremium ? 'Golden ' : '') + history.cardName;
		this.dustValue = history.dustValue;
		this.creationDate = new Date(history.creationTimestamp).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
		});
	}

	@HostListener('mousedown') onClick() {
		this.stateUpdater.next(new ShowCardDetailsEvent(this.cardId));
		this.events.broadcast(Events.HIDE_TOOLTIP, this.cardId);
	}

	// @HostListener('mouseenter') onMouseEnter() {
	// 	const rect = this.el.nativeElement.getBoundingClientRect();
	// 	const x = rect.left - rect.width + 120;
	// 	const y = rect.top + rect.height / 2;
	// 	this.events.broadcast(Events.SHOW_TOOLTIP, this.cardId, x, y, true, rect);
	// }

	// @HostListener('mouseleave')
	// onMouseLeave() {
	// 	// this.events.broadcast(Events.HIDE_TOOLTIP, this.cardId);
	// }
}
