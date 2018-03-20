import { Component, NgZone, Input, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import * as Raven from 'raven-js';
import { Ng2MenuItem } from 'ng2-material-dropdown';

import { AllCardsService } from '../../services/all-cards.service';

import { Card } from '../../models/card';
import { Set, SetCard, MissingCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'cards',
	styleUrls: [`../../../css/component/collection/cards.component.scss`],
	template: `
		<div class="cards">
			<h1 *ngIf="_set">
				<img src="{{'/Files/assets/images/set-logos/' + _set.id + '.png'}}" class="set-logo" />
				<span class="text set-name">{{_set.name}}</span>
			</h1>
			<div class="show-filter" *ngIf="_activeCards">
				<span class="label">Show</span>
				<ng2-dropdown (onItemClicked)="selectFilter($event)">
				    <ng2-dropdown-button>{{labelFor(_activeFilter)}}</ng2-dropdown-button>
				    <ng2-dropdown-menu [appendToBody]="false" [width]="4">
		                <ng2-menu-item value="{{FILTER_ALL}}">{{labelFor(FILTER_ALL)}}</ng2-menu-item>
				        <ng2-menu-item value="{{FILTER_OWN}}">{{labelFor(FILTER_OWN)}}</ng2-menu-item>
		                <ng2-menu-item value="{{FILTER_DONT_OWN}}">{{labelFor(FILTER_DONT_OWN)}}</ng2-menu-item>
				    </ng2-dropdown-menu>
				</ng2-dropdown>
			</div>
			<ul class="cards-list" *ngIf="_activeCards">
				<li *ngFor="let card of _activeCards">
					<card-view [card]="card">/</card-view>
				</li>
			</ul>
			<ul class="pagination" *ngIf="_numberOfPages > 1">
				<li class="arrow previous" (click)="previousPage()" [ngClass]="_currentPage == 0 ? 'disabled' : ''">{{'<'}}</li>
				<li *ngFor="let page of _pages" [ngClass]="_currentPage == page ? 'active' : ''" (click)="goToPage(page)">{{page + 1}}</li>
				<li class="arrow next" (click)="nextPage()" [ngClass]="_currentPage == _numberOfPages ? 'disabled' : ''">{{'>'}}</li>
			</ul>
			<div *ngIf="!_activeCards">
				Oh no! We couldn't find any cards matching your search
			</div>
		</div>
	`,
})
export class CardsComponent {

	private readonly MAX_CARDS_DISPLAYED_PER_PAGE = 18;

	private readonly FILTER_ALL = 'all';
	private readonly FILTER_OWN = 'own';
	private readonly FILTER_DONT_OWN = 'dontown';

	// @Input() private maxCards: number;
	private _cardList: SetCard[];
	private _activeCards: SetCard[];
	private _set: Set;
	private _cardsIndexRangeStart = 0;
	private _numberOfPages: number;
	private _currentPage = 0;
	private _pages: number[] = [];
	private _activeFilter = this.FILTER_ALL;
	// private _showRarities = false;
	// private showMissingCards = false;

	constructor(
		// private sanitizer: DomSanitizer,
		private cards: AllCardsService) {
		// console.log('constructor CollectionComponent');
	}

	@Input('set') set cardSet(set: Set) {
		this._set = set;
	}

	@Input('cardList') set cardList(cardList: SetCard[]) {
		this._cardList = cardList;
		this.updateShownCards();
	}

	private selectFilter(event: Ng2MenuItem) {
		this._activeFilter = event.value;
		console.log('selected item', event, this._activeFilter);
		this.updateShownCards();
	}

	private previousPage() {
		this._currentPage = Math.max(0, this._currentPage - 1);
		this.updateShownCards();
	}

	private nextPage() {
		this._currentPage = Math.min(this._numberOfPages, this._currentPage + 1);
		this.updateShownCards();
	}

	private goToPage(page: number) {
		this._currentPage = page;
		this.updateShownCards();
	}

	private updateShownCards() {
		this._cardsIndexRangeStart = this._currentPage * this.MAX_CARDS_DISPLAYED_PER_PAGE;
		let filteredCards = this._cardList.filter(this.filterFunction());
		this._pages = [];
		this._numberOfPages = Math.ceil(filteredCards.length / this.MAX_CARDS_DISPLAYED_PER_PAGE);
		console.log('number of pages', this._numberOfPages, filteredCards);
		for (let i = 0; i < this._numberOfPages; i++) {
			this._pages.push(i);
		}
		this._activeCards = filteredCards.slice(
			this._cardsIndexRangeStart,
			this._cardsIndexRangeStart + this.MAX_CARDS_DISPLAYED_PER_PAGE);
		// console.log('showing cards', this._currentPage, this._cardsIndexRangeStart);
		// console.log('active cards', this._activeCards);
	}

	private filterFunction() {
		switch (this._activeFilter) {
			case this.FILTER_ALL:
				return (card: SetCard) => true;
			case this.FILTER_OWN:
				return (card: SetCard) => (card.ownedNonPremium + card.ownedPremium > 0);
			case this.FILTER_DONT_OWN:
				return (card: SetCard) => (card.ownedNonPremium + card.ownedPremium == 0);
			default:
				console.log('unknown filter', this._activeFilter);
		}
	}

	private labelFor(filter: string) {
		switch (filter) {
			case this.FILTER_ALL: return 'All cards';
			case this.FILTER_OWN: return 'Only cards I have';
			case this.FILTER_DONT_OWN: return 'Only cards I don\'t have';
			default: console.log('unknown filter', filter);
		}
	}
}
