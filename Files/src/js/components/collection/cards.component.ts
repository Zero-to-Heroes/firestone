import { Component, NgZone, Input, SimpleChanges, ViewEncapsulation, ElementRef, AfterViewInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { IOption } from 'ng-select';

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
			<span *ngIf="_set && !_searchString" class="set-title">
				<img src="{{'/Files/assets/images/sets/' + _set.id + '.png'}}" class="set-logo" />
				<span class="text set-name">{{_set.name}}</span>
			</span>
			<span *ngIf="!_set && _searchString" class="set-title">
				<span class="text set-name">{{_searchString}}</span>
			</span>
			<div class="show-filter" *ngIf="_activeCards" [ngStyle]="{'display': _searchString ? 'none' : 'flex'}">
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
			<section class="empty-state no-missing-card-in-set" *ngIf="_set && _activeCards.length == 0 && _activeFilter == FILTER_DONT_OWN">
				<div class="state-container">
					<i class="i-238X167 pale-pink-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#empty_state_Only_cards_I_don’t_have_illustration"/>
						</svg>
					</i>
					<span class="title">This set is complete and you have it all!</span>
					<span class="subtitle">Keep up the good work.</span>
				</div>
			</section>
			<!-- Show screen when you have no card in a set -->
			<section class="empty-state no-card-in-set" *ngIf="_set && _activeCards.length == 0 && _activeFilter == FILTER_OWN">
				<div class="state-container">
					<i class="i-167X143 pale-pink-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#empty_state_Only_cards_I_have_illustration"/>
						</svg>
					</i>
					<span class="title">No cards from this set yet!</span>
					<span class="subtitle">Don't worry, keep playing and get new packs.</span>
				</div>
			</section>
			<!-- Show screen when you have no golden card in a set -->
			<section class="empty-state no-golden-card-in-set" *ngIf="_set && _activeCards.length == 0 && _activeFilter == FILTER_GOLDEN_OWN">
				<div class="state-container">
					<i class="i-121x147 pale-pink-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#empty_state_Only_golden_cards_I_have_illustration"/>
						</svg>
					</i>
					<span class="title">No golden cards from this set yet!</span>
					<span class="subtitle">Don't worry, keep playing and get these shiny friends.</span>
				</div>
			</section>
			<!-- Show screen when no result in search -->
			<section class="empty-state no-search-result" *ngIf="_activeCards.length == 0 && _searchString">
				<div class="state-container">
					<i class="i-110X86 pale-pink-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#No_result_illustration"/>
						</svg>
					</i>
					<span class="title">Oh No! Nothing Matches: "{{_searchString}}"</span>
					<span class="subtitle">Don't give up - check the spelling or try less specific terms.</span>
				</div>
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
		</div>
	`,
})
export class CardsComponent implements AfterViewInit {

	readonly MAX_CARDS_DISPLAYED_PER_PAGE = 18;

	readonly FILTER_OWN = 'own';
	readonly FILTER_GOLDEN_OWN = 'goldenown';
	readonly FILTER_DONT_OWN = 'dontown';
	readonly FILTER_ALL = 'all';

	readonly selectOptions: Array<IOption> = [
		{label: this.labelFor(this.FILTER_OWN), value: this.FILTER_OWN},
		{label: this.labelFor(this.FILTER_GOLDEN_OWN), value: this.FILTER_GOLDEN_OWN},
		{label: this.labelFor(this.FILTER_DONT_OWN), value: this.FILTER_DONT_OWN},
		{label: this.labelFor(this.FILTER_ALL), value: this.FILTER_ALL},
	]

	_searchString: string;
	_cardList: SetCard[];
	_activeCards: SetCard[];
	_set: Set;
	_cardsIndexRangeStart = 0;
	_numberOfPages: number;
	_currentPage = 0;
	_pages: number[] = [];
	_activeFilter = this.FILTER_ALL;
	// private _showRarities = false;
	// private showMissingCards = false;

	constructor(private cards: AllCardsService, private elRef: ElementRef) {

	}

	ngAfterViewInit() {
		// let toggleEl: HTMLElement = this.elRef.nativeElement.querySelector('.toggle');
		// toggleEl.innerHTML =
		// 	`<i class="i-30">
		// 		<svg class="svg-icon-fill">
		// 			<use xlink:href="/Files/assets/svg/sprite.svg#arrow"/>
		// 		</svg>
		// 	</i>`;
		let singleEl: HTMLElement = this.elRef.nativeElement.querySelector('.single');
		let caretEl = singleEl.appendChild(document.createElement('i'));
		caretEl.innerHTML =
			`<svg class="svg-icon-fill">
				<use xlink:href="/Files/assets/svg/sprite.svg#arrow"/>
			</svg>`;
		caretEl.classList.add('i-30');
		caretEl.classList.add('caret');
	}

	@Input('set') set cardSet(set: Set) {
		this._currentPage = 0;
		this._set = set;
	}

	@Input('cardList') set cardList(cardList: SetCard[]) {
		this._currentPage = 0;
		this._cardList = cardList;
		this.updateShownCards();
	}

	@Input('searchString') set searchString(searchString: string) {
		this._currentPage = 0;
		this._searchString = searchString;
	}

	selectFilter(option: IOption) {
		// console.log('selected item', option, this._activeFilter);
		this._activeFilter = option.value;
		this.updateShownCards();
	}

	previousPage() {
		this._currentPage = Math.max(0, this._currentPage - 1);
		this.updateShownCards();
	}

	nextPage() {
		this._currentPage = Math.min(this._numberOfPages, this._currentPage + 1);
		this.updateShownCards();
	}

	goToPage(page: number) {
		this._currentPage = page;
		this.updateShownCards();
	}

	private updateShownCards() {
		// console.log('updating card list', this._cardList);
		this._cardsIndexRangeStart = this._currentPage * this.MAX_CARDS_DISPLAYED_PER_PAGE;
		let filteredCards = this._cardList.filter(this.filterFunction());
		this._pages = [];
		this._numberOfPages = Math.ceil(filteredCards.length / this.MAX_CARDS_DISPLAYED_PER_PAGE);
		// console.log('number of pages', this._numberOfPages, filteredCards);
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
