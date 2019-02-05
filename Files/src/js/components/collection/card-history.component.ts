import { Component, Input, ElementRef, HostListener, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, ViewRef } from '@angular/core';

import { Events } from '../../services/events.service';
import { CardHistoryStorageService } from '../../services/collection/card-history-storage.service';

import { CardHistory } from '../../models/card-history';
import { SetCard } from '../../models/set';

declare var overwolf: any;
declare var ga: any;

@Component({
	selector: 'card-history',
	styleUrls: [
		`../../../css/component/collection/card-history.component.scss`,
		`../../../css/global/scrollbar.scss`,
		`../../../css/global/forms.scss`
	],
	template: `
		<div class="card-history">
			<div class="top-container">
				<span class="title">My Card History</span>
				<section class="toggle-label">
					<form class="settings-section form-toggle">
						<fieldset name="">
							<div class="form-section">
								<input hidden type="checkbox" name="" id="a-01" (change)="toggleShowOnlyNewCards()">
								<label for="a-01">
									<p class="settings-p">Show only new cards</p>
									<b></b>
								</label>
							</div>
						</fieldset>
					</form>
				</section>
			</div>
			<ul class="history">
				<li *ngFor="let historyItem of shownHistory; trackBy: trackById">
					<card-history-item 
						[historyItem]="historyItem"
						[active]="_selectedCard && _selectedCard.id == historyItem.cardId || false">
					</card-history-item>
				</li>
				<li *ngIf="cardHistory && cardHistory.length < totalHistoryLength" class="more-data-container">
					<span class="more-data-text">You've viewed {{cardHistory.length}} of {{totalHistoryLength}} cards</span>
					<button class="load-more-button" (click)="loadMore()">Load More</button>
				</li>
				<section *ngIf="!cardHistory || cardHistory.length == 0" class="empty-state">
					<i class="i-60x78 pale-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#empty_state_my_card_history"/>
						</svg>
					</i>
					<span>No history yet</span>
					<span>Open a pack to start one!</span>
				</section>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHistoryComponent implements AfterViewInit {

	private readonly MAX_RESULTS_DISPLAYED = 1000;
	
	cardHistory: CardHistory[];
	shownHistory: CardHistory[];
	totalHistoryLength: number;
	_selectedCard: SetCard;
	
	private showOnlyNewCards: boolean;
	private limit = 100;
	private refreshing = false;

	@Input() set selectedCard(selectedCard: SetCard) {
		this._selectedCard = selectedCard;
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(
		private storage: CardHistoryStorageService,
		private el: ElementRef,
		private cdr: ChangeDetectorRef,
		private events: Events) {
		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "CollectionWindow") {
				return;
			}
			// console.log('state changed card-history', message);
			if (message.window_state == 'normal') {
				this.refreshContents();
			}
		});
	}

	ngAfterViewInit() {
		this.cdr.detach();
		this.refreshContents();
	}

	async refreshContents() {
		if (this.refreshing) {
			return;
		}
		this.refreshing = true;
		console.log('request to load');
		this.totalHistoryLength = await this.storage.countHistory();
		const result = await this.storage.loadAll(this.limit);
		// console.log('loaded history', result);
		this.cardHistory = result.splice(0, this.MAX_RESULTS_DISPLAYED);
		this.shownHistory = this.cardHistory;
		this.refreshing = false;
		this.filterView();
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async loadMore() {
		console.log('request to load more');
		const result = await this.storage.loadAll(0);
		// console.log('loaded history', result);
		this.cardHistory = result.splice(0, this.MAX_RESULTS_DISPLAYED);
		this.shownHistory = this.cardHistory;
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleShowOnlyNewCards() {
		this.showOnlyNewCards = !this.showOnlyNewCards;
		this.filterView();
		if (!(<ViewRef>this.cdr).destroyed) {
			this.cdr.detectChanges();
		}
	}

	filterView() {
		if (this.showOnlyNewCards) {
			this.shownHistory = this.cardHistory.filter((card: CardHistory) => card.isNewCard);
		}
		else {
			this.shownHistory = this.cardHistory;
		}
	}

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
		// console.log('handling history click', event);
		let rect = this.el.nativeElement.querySelector('.history').getBoundingClientRect();
		// console.log('element rect', rect);
		let scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}

	trackById(index, history: CardHistory) {
		return history.id;
	}
}
