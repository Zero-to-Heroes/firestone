import { Component, NgZone, OnInit } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../../services/collection/collection-manager.service';
import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';
import { CardHistoryStorageService } from '../../services/collection/card-history-storage.service';

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
				<li *ngFor="let historyItem of shownHistory">
					<card-history-item [historyItem]="historyItem"></card-history-item>
				</li>
				<li *ngIf="cardHistory && cardHistory.length < totalHistoryLength" class="more-data-container">
					<span class="more-data-text">You've viewed {{cardHistory.length}} of {{totalHistoryLength}} cards</span>
					<button (click)="loadMore()">Load More</button>
				</li>
			</ul>
		</div>
	`,
})
// 7.1.1.17994
export class CardHistoryComponent implements OnInit {

	private readonly MAX_RESULTS_DISPLAYED = 1000;

	private showOnlyNewCards: boolean;
	private cardHistory: CardHistory[];
	private shownHistory: CardHistory[];
	private totalHistoryLength: number;
	private limit = 100;

	constructor(private storage: CardHistoryStorageService, private events: Events) {
	}

	ngOnInit() {
		console.log('request to load');
		this.storage.loadAll(
			(result: CardHistory[]) => {
				console.log('loaded history', result);
				this.cardHistory = result.splice(0, this.MAX_RESULTS_DISPLAYED);
				this.shownHistory = this.cardHistory;
			},
			this.limit);

		this.storage.countHistory((historySize) => {
			this.totalHistoryLength = historySize;
		})
	}

	private loadMore() {
		console.log('request to load more');
		this.storage.loadAll(
			(result: CardHistory[]) => {
				console.log('loaded history', result);
				this.cardHistory = result.splice(0, this.MAX_RESULTS_DISPLAYED);
				this.shownHistory = this.cardHistory;
			},
			0);
	}

	private toggleShowOnlyNewCards() {
		this.showOnlyNewCards = !this.showOnlyNewCards;
		if (this.showOnlyNewCards) {
			this.shownHistory = this.cardHistory.filter((card: CardHistory) => card.isNewCard);
		}
		else {
			this.shownHistory = this.cardHistory;
		}
	}
}
