import { Component, NgZone, OnInit } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../../services/collection-manager.service';
import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';

import { SetCard } from '../../models/set';

declare var overwolf: any;
declare var ga: any;

@Component({
	selector: 'card-search',
	styleUrls: [`../../../css/component/collection/card-search.component.scss`],
	template: `
		<div class="card-search" (keyup)="onValidateSearch($event)" (blur)="onFocusLost()">
			<input (input)="onSearchStringChange($event.target.value)" placeholder="Search card..." />
			<ul *ngIf="searchResults" class="search-results">
				<li *ngFor="let result of searchResults" (click)="showCard(result)">{{result.name}}</li>
			</ul>
		</div>
	`,
})
// 7.1.1.17994
export class CardSearchComponent {

	private searchResults: SetCard[];

	constructor(private cards: AllCardsService, private events: Events) {
	}

	private onSearchStringChange(searchString: string) {
		this.searchResults = [];
		console.log('updating serach string', searchString);
		if (searchString.length <= 2) {
			return;
		}
		this.searchResults = this.cards.searchCards(searchString);
	}

	private onValidateSearch(event: KeyboardEvent) {
		if (event.keyCode === 13) {
			console.log('validating search', event);

			this.events.broadcast(Events.SHOW_CARDS, this.searchResults);
			this.searchResults = [];
		}
	}

	private showCard(result: SetCard) {
		console.error('showing card when clicking on search proposition in search box - but what should actually happen?', result);
	}

	private onFocusLost() {
		console.log('focus lost');
		this.searchResults = [];
	}
}
