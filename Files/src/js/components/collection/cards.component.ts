import { Component, NgZone, Input, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import * as Raven from 'raven-js';

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
			<ul class="cards-list" *ngIf="_cardList">
				<li *ngFor="let card of _activeCards">
					<card-view [card]="card">/</card-view>
				</li>
			</ul>
			<ul class="pagination">
				<li class="arrow previous" (click)="previousPage()" [ngClass]="_currentPage == 0 ? 'disabled' : ''">{{'<'}}</li>
				<li *ngFor="let page of _pages" [ngClass]="_currentPage == page ? 'active' : ''" (click)="goToPage(page)">{{page + 1}}</li>
				<li class="arrow next" (click)="nextPage()" [ngClass]="_currentPage == _numberOfPages ? 'disabled' : ''">{{'>'}}</li>
			</ul>
		</div>
	`,
})
export class CardsComponent {

	private readonly MAX_CARDS_DISPLAYED_PER_PAGE = 18;

	// @Input() private maxCards: number;
	private _cardList: SetCard[];
	private _activeCards: SetCard[];
	private _set: Set;
	private _cardsIndexRangeStart = 0;
	private _numberOfPages: number;
	private _currentPage = 0;
	private _pages: number[] = [];
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
		this._numberOfPages = Math.ceil(cardList.length / this.MAX_CARDS_DISPLAYED_PER_PAGE);
		for (let i = 0; i < this._numberOfPages; i++) {
			this._pages.push(i);
		}
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
		this._activeCards = this._cardList.slice(this._cardsIndexRangeStart, this._cardsIndexRangeStart + this.MAX_CARDS_DISPLAYED_PER_PAGE);
		console.log('showing cards', this._currentPage, this._cardsIndexRangeStart);
		console.log('active cards', this._activeCards);
	}



	// private toggleShowRarities() {
	// 	this._showRarities = !this._showRarities;
	// 	this.showMissingCards = !this.showMissingCards;
	// }

	// private collectedWidth() {
	// 	return this.maxCards == 0 ? 0 : Math.max(33, 100.0 * this.cardSet.numberOfCards() / this.maxCards);
	// }

	// private background() {
	// 	return this.sanitizer.bypassSecurityTrustStyle('url(/Files/assets/images/set-background/' + this.cardSet.id + '.jpg)')
	// }

	// private clip() {
	// 	return this.sanitizer.bypassSecurityTrustStyle('inset(0 ' + (100 - 100.0 * this.cardSet.ownedCards / this.cardSet.numberOfCards()) + '% 0 0)')
	// }

}
