import { Component, NgZone, ViewChild, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewRef } from '@angular/core';
import { FormControl } from '@angular/forms'; 


import { CollectionManager } from '../../services/collection/collection-manager.service';
import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';

import { SetCard } from '../../models/set';
import { Card } from '../../models/card';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';

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
					[formControl]="searchForm"
					(mousedown)="onMouseDown($event)"
					(blur)="onFocusLost()"
					placeholder="Search card..." />
			</label>
			<ul *ngIf="showSearchResults" class="search-results">
				<card-search-autocomplete-item *ngFor="let result of searchResults; trackBy: trackById"
					[fullString]="result.name"
					[searchString]="searchString"
					(click)="showCard(result)">
				</card-search-autocomplete-item>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSearchComponent implements AfterViewInit {

	searchForm = new FormControl();

	searchString: string;
	searchResults: SetCard[] = [];
	showSearchResults = false;

	constructor(
		private cards: AllCardsService, 
		private events: Events, 
		private collectionManager: CollectionManager, 
		private cdr: ChangeDetectorRef) {
	}

	ngAfterViewInit() {
		this.cdr.detach();
		this.searchForm.valueChanges
			.pipe(debounceTime(200))
			.pipe(distinctUntilChanged())
			.subscribe(data => {
				this.searchString = data;
				this.onSearchStringChange();
			});
		this.events.on(Events.SET_SELECTED).subscribe((data) => this.resetSearchString());
		this.events.on(Events.FORMAT_SELECTED).subscribe((data) => this.resetSearchString());
		this.events.on(Events.MODULE_SELECTED).subscribe((data) => this.resetSearchString());
		this.events.on(Events.SHOW_CARD_MODAL).subscribe((data) => this.resetSearchString());
	}

	onSearchStringChange() {
		this.showSearchResults = false;
		console.log('updating serach string', this.searchString);
		if (this.searchString.length < 2) {
			return;
		}
		this.updateSearchResults();
	}

	onValidateSearch(event: KeyboardEvent) {
		if (event.keyCode === 13 && this.searchString) {
			console.log('validating search', this.searchResults, this.searchString);

			this.events.broadcast(Events.SHOW_CARDS, this.searchResults, this.searchString);
			this.showSearchResults = false;
			if (!(<ViewRef>this.cdr).destroyed) {
				this.cdr.detectChanges();
			}
		}
	}

	showCard(result: SetCard) {
		this.events.broadcast(Events.SHOW_CARD_MODAL, result.id);
		this.events.broadcast(Events.HIDE_TOOLTIP, result.id);
	}

	onFocusLost() {
		// console.log('focus lost');
		setTimeout(() => {
			this.showSearchResults = false;
			if (!(<ViewRef>this.cdr).destroyed) {
				this.cdr.detectChanges();
			}
		}, 500);
	}

	onMouseDown(event: Event) {
		event.stopPropagation();
	}

	trackById(index, card: SetCard) {
		// console.log('tracking by id', index, card);
		return card.id;
	}

	private resetSearchString() {
		console.log('resetting search string');
		this.searchForm.setValue('');
	}

	private updateSearchResults() {
		this.searchResults = this.cards.searchCards(this.searchString);
		console.log('raw search results', this.searchResults);
		this.collectionManager.getCollection((collection: Card[]) => {
			console.log('retrieved collection', collection);
			this.searchResults = this.searchResults.map((card) => {
				let collectionCard: Card = this.findCollectionCard(collection, card);
				return new SetCard(
					card.id, 
					card.name, 
					card.cardClass,
					card.rarity, 
					card.cost,
					collectionCard ? collectionCard.count : 0, 
					collectionCard ? collectionCard.premiumCount : 0)
			});
			console.log('Updated search results', this.searchResults);
			this.showSearchResults = this.searchResults.length > 0;
			if (!(<ViewRef>this.cdr).destroyed) {
				this.cdr.detectChanges();
			}
		})
	}

	private findCollectionCard(collection: Card[], card: SetCard): Card {
		for (let i = 0; i < collection.length; i++) {
			let collectionCard = collection[i];
			if (collectionCard.id == card.id) {
				// console.log('Matching card', collectionCard, card);
				return collectionCard;
			}
		}
		// console.log('Could not find matching cards', card, collection);
		return null;
	}
}
