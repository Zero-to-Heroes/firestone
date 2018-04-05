import { Component, NgZone, Input, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { IOption } from 'ng-select';
import * as Raven from 'raven-js';

import { AllCardsService } from '../../services/all-cards.service';

import { Card } from '../../models/card';
import { Set, SetCard, MissingCard } from '../../models/set';

declare var overwolf: any;

@Component({
	selector: 'cards',
	styleUrls: [`../../../css/component/collection/cards.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="cards">
			<span *ngIf="_set" class="set-title">
				<img src="{{'/Files/assets/images/sets/' + _set.id + '.png'}}" class="set-logo" />
				<span class="text set-name">{{_set.name}}</span>
			</span>
			<div class="show-filter" *ngIf="_activeCards">
				<span class="label">Show</span>
				<ng-select
					[options]="selectOptions"
					[(ngModel)]="_activeFilter"
					(selected)="selectFilter($event)"
					[noFilter]="1">
					<ng-template
				        #optionTemplate
				        let-option="option">
				        <span>{{option?.label}}</span>
				        <i class="i-30" *ngIf="option.value == _activeFilter">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#selected_dropdown"/>
							</svg>
						</i>
				    </ng-template>
				</ng-select>
			</div>
			<ul class="cards-list" *ngIf="_activeCards">
				<li *ngFor="let card of _activeCards">
					<card-view [card]="card">/</card-view>
				</li>
			</ul>
			<!-- Show screen when you have completed a set -->
			<section class="no-missing-card-in-set" *ngIf="_set && !_activeCards.length > 0 && _activeFilter == FILTER_DONT_OWN">
				<i class="i-238X167 pale-pink-theme">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#empty_state_Only_cards_I_don’t_have_illustration"/>
					</svg>
				</i>
				<span class="title">This set is complete and you have it all!</span>
				<span class="subtitle">Keep up the good work.</span>
			</section>
			<ul class="pagination" *ngIf="_numberOfPages > 1">
				<li class="arrow previous" (click)="previousPage()" [ngClass]="_currentPage == 0 ? 'disabled' : ''">
					<i class="i-30">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#arrow"/>
						</svg>
					</i>
				</li>
				<li *ngFor="let page of _pages" [ngClass]="_currentPage == page ? 'active' : ''" (click)="goToPage(page)">{{page + 1}}</li>
				<li class="arrow next" (click)="nextPage()" [ngClass]="_currentPage == _numberOfPages ? 'disabled' : ''">
					<i class="i-30">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#arrow"/>
						</svg>
					</i>
				</li>
			</ul>
			<div *ngIf="!_activeCards">
				Oh no! We couldn't find any cards matching your search
			</div>
		</div>
	`,
})
export class CardsComponent {

	private readonly MAX_CARDS_DISPLAYED_PER_PAGE = 18;

	private readonly FILTER_OWN = 'own';
	private readonly FILTER_GOLDEN_OWN = 'goldenown';
	private readonly FILTER_DONT_OWN = 'dontown';
	private readonly FILTER_ALL = 'all';

	private readonly selectOptions: Array<IOption> = [
		{label: this.labelFor(this.FILTER_OWN), value: this.FILTER_OWN},
		{label: this.labelFor(this.FILTER_GOLDEN_OWN), value: this.FILTER_GOLDEN_OWN},
		{label: this.labelFor(this.FILTER_DONT_OWN), value: this.FILTER_DONT_OWN},
		{label: this.labelFor(this.FILTER_ALL), value: this.FILTER_ALL},
	]

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

	private selectFilter(option: IOption) {
		console.log('selected item', option, this._activeFilter);
		this._activeFilter = option.value;
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
			case this.FILTER_GOLDEN_OWN:
				return (card: SetCard) => (card.ownedPremium > 0);
			case this.FILTER_DONT_OWN:
				return (card: SetCard) => (card.ownedNonPremium + card.ownedPremium == 0);
			default:
				console.log('unknown filter', this._activeFilter);
		}
	}

	private labelFor(filter: string) {
		switch (filter) {
			case this.FILTER_ALL: return 'All existing cards';
			case this.FILTER_OWN: return 'Only cards I have';
			case this.FILTER_GOLDEN_OWN: return 'Only golden cards I have';
			case this.FILTER_DONT_OWN: return 'Only cards I do not have';
			default: console.log('unknown filter', filter);
		}
	}
}
