import { Component, NgZone, OnInit } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../../services/collection/collection-manager.service';
import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';

import { SetCard } from '../../models/set';

declare var overwolf: any;
declare var ga: any;

@Component({
	selector: 'card-search',
	styleUrls: [
		`../../../css/component/collection/card-search.component.scss`,
		`../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="card-search" (keyup)="onValidateSearch($event)" (blur)="onFocusLost()">
			<label class="search-label" [ngClass]="{'search-active': searchString}">
				<i class="i-30">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#search"/>
					</svg>
				</i>
				<input [(ngModel)]="searchString" (input)="onSearchStringChange()" placeholder="Search card..." />
			</label>
			<ul *ngIf="searchResults.length > 0" class="search-results">
				<card-search-autocomplete-item *ngFor="let result of searchResults"
					[fullString]="result.name"
					[searchString]="searchString"
					(click)="showCard(result)">
				</card-search-autocomplete-item>
			</ul>
		</div>
	`,
})
// 7.1.1.17994
export class CardSearchComponent {

	private searchString: string;
	private searchResults: SetCard[];

	constructor(private cards: AllCardsService, private events: Events) {
	}

	private onSearchStringChange() {
		this.searchResults = [];
		console.log('updating serach string', this.searchString);
		if (this.searchString.length <= 2) {
			return;
		}
		this.searchResults = this.cards.searchCards(this.searchString);
	}

	private onValidateSearch(event: KeyboardEvent) {
		if (event.keyCode === 13) {
			console.log('validating search', event);

			this.events.broadcast(Events.SHOW_CARDS, this.searchResults, this.searchString);
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
