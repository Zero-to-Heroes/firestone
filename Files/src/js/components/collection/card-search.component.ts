import { Component, NgZone, OnInit } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../../services/collection/collection-manager.service';
import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';

import { SetCard } from '../../models/set';
import { Card } from '../../models/card';

declare var overwolf: any;
declare var ga: any;

@Component({
	selector: 'card-search',
	styleUrls: [
		`../../../css/component/collection/card-search.component.scss`,
		`../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="card-search" (keyup)="onValidateSearch($event)">
			<label class="search-label" [ngClass]="{'search-active': searchString}">
				<i class="i-30">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#search"/>
					</svg>
				</i>
				<input
					[(ngModel)]="searchString"
					(input)="onSearchStringChange()"
					(blur)="onFocusLost()"
					placeholder="Search card..." />
			</label>
			<!-- Don't show autocomplete search results for now -->
			<ul *ngIf="false && showSearchResults" class="search-results">
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
	private searchResults: SetCard[] = [];
	private showSearchResults = false;

	constructor(private cards: AllCardsService, private events: Events, private collectionManager: CollectionManager) {
	}

	private onSearchStringChange() {
		this.showSearchResults = false;
		// console.log('updating serach string', this.searchString);
		if (this.searchString.length <= 2) {
			return;
		}
		this.updateSearchResults();
	}

	private onValidateSearch(event: KeyboardEvent) {
		if (event.keyCode === 13) {
			console.log('validating search', this.searchResults, this.searchString);

			this.events.broadcast(Events.SHOW_CARDS, this.searchResults, this.searchString);
			this.showSearchResults = false;
		}
	}

	private showCard(result: SetCard) {
		console.error('showing card when clicking on search proposition in search box - but what should actually happen?', result);
	}

	private onFocusLost() {
		console.log('focus lost');
		this.showSearchResults = false;
	}

	private updateSearchResults() {
		this.searchResults = this.cards.searchCards(this.searchString);
		this.collectionManager.getCollection((collection: Card[]) => {
			// console.log('retrieved collection', collection);
			this.searchResults.forEach((card: SetCard) => {
				let collectionCard: Card = this.findCollectionCard(collection, card);
				if (!collectionCard) {
					return;
				}

				if (collectionCard.Premium) {
					card.ownedPremium = collectionCard.Count;
				}
				else {
					card.ownedNonPremium = collectionCard.Count;
				}
			})
			// console.log('Updated search results', this.searchResults);
			this.showSearchResults = this.searchResults.length > 0;
		})
	}

	private findCollectionCard(collection: Card[], card: SetCard): Card {
		for (let i = 0; i < collection.length; i++) {
			let collectionCard = collection[i];
			if (collectionCard.Id == card.id) {
				// console.log('Matching card', collectionCard, card);
				return collectionCard;
			}
		}
		// console.log('Could not find matching cards', card, collection);
		return null;
	}
}
