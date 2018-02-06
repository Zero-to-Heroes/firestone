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
				<li *ngFor="let historyItem of shownHistory">
					<card-history-item [historyItem]="historyItem"></card-history-item>
				</li>
			</ul>
		</div>
	`,
})
// 7.1.1.17994
export class CardHistoryComponent implements OnInit {

	private showOnlyNewCards: boolean;
	private cardHistory: CardHistory[];
	private shownHistory: CardHistory[];

	constructor(private storage: CardHistoryStorageService, private events: Events) {
	}

	ngOnInit() {
		// From the last 5 days
		let timestampOfEarliestHistory = Date.now() - 5 * 24 * 3600 * 1000;
		this.storage.loadAll(
			(result: CardHistory[]) => {
				console.log('loaded history', result);
				this.cardHistory = result.reverse();
				this.shownHistory = this.cardHistory;
			},
			timestampOfEarliestHistory);
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
