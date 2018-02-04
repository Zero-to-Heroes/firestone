import { Component, NgZone, OnInit } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../../services/collection-manager.service';
import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';
import { CardHistoryStorageService } from '../../services/card-history-storage.service';

import { SetCard } from '../../models/set';
import { CardHistory } from '../../models/card-history';

declare var overwolf: any;
declare var ga: any;

@Component({
	selector: 'card-history',
	styleUrls: [`../../../css/component/collection/card-history.component.scss`],
	template: `
		<div class="card-history">
			<div class="top-container">
				<span class="title">My Card History</span>
				<input type="checkbox" [checked]="showOnlyNewCards" (change)="toggleShowOnlyNewCards()" />
			</div>
			<ul class="history">
				<li *ngFor="let history of cardHistory">
					<img class="rarity" src="{{rarityImg(history.rarity)}}" />
					<span class="name">{{getCardName(history)}}</span>
					<span class="dust-amount" *ngIf="!history.isNewCard">{{history.dustValue}}</span>
					<span class="new" *ngIf="history.isNewCard">NEW</span>
					<span class="date">{{formatDate(history.creationTimestamp)}}</span>
				</li>
			</ul>
		</div>
	`,
})
// 7.1.1.17994
export class CardHistoryComponent implements OnInit {

	private showOnlyNewCards: boolean;
	private cardHistory: CardHistory[];

	constructor(private storage: CardHistoryStorageService, private events: Events) {
	}

	ngOnInit() {
		// From the last 5 days
		let timestampOfEarliestHistory = Date.now() - 5 * 24 * 3600 * 1000;
		this.storage.loadAll(
			(result: CardHistory[]) => {
				console.log('loaded history', result);
				this.cardHistory = result.reverse();
			},
			timestampOfEarliestHistory);
	}

	private toggleShowOnlyNewCards() {
		this.showOnlyNewCards = !this.showOnlyNewCards;
	}

	private rarityImg(rarity: string) {
		return `/Files/assets/images/rarity-${rarity}.png`;
	}

	private formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit"} );
	}

	private getCardName(history: CardHistory): string {
		return (history.isPremium ? 'Golden ' : '') + history.cardName;
	}
}
