import { Component, NgZone, ElementRef, HostListener } from '@angular/core';

import * as Raven from 'raven-js';

import { CollectionManager } from '../../services/collection/collection-manager.service';
import { AllCardsService } from '../../services/all-cards.service';
import { Events } from '../../services/events.service';
import { CardHistoryStorageService } from '../../services/collection/card-history-storage.service';

import { SetCard } from '../../models/set';
import { CardHistory } from '../../models/card-history';

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
				<li *ngFor="let historyItem of shownHistory">
					<card-history-item [historyItem]="historyItem"></card-history-item>
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
})
// 7.1.1.17994
export class CardHistoryComponent {

	private readonly MAX_RESULTS_DISPLAYED = 1000;

	private showOnlyNewCards: boolean;
	private cardHistory: CardHistory[];
	private shownHistory: CardHistory[];
	private totalHistoryLength: number;
	private limit = 100;
	private refreshing = false;

	constructor(
		private storage: CardHistoryStorageService,
		private el: ElementRef,
		private events: Events) {
		overwolf.windows.onStateChanged.addListener((message) => {
			if (message.window_name != "CollectionWindow") {
				return;
			}
			console.log('state changed card-history', message);
			if (message.window_state == 'normal') {
				this.refreshContents();
			}
		});
		this.refreshContents();
	}

	refreshContents() {
		if (this.refreshing) {
			return;
		}
		this.refreshing = true;
		console.log('request to load');
		this.storage.loadAll(
			(result: CardHistory[]) => {
				console.log('loaded history', result);
				this.cardHistory = result.splice(0, this.MAX_RESULTS_DISPLAYED);
				this.shownHistory = this.cardHistory;
				this.refreshing = false;
			},
			this.limit);

		this.storage.countHistory((historySize) => {
			this.totalHistoryLength = historySize;
		})
	}

	private loadMore() {
		console.log('request to load more');
		this.storage.loadAll(
			(result: CardHistory[]) => {
				console.log('loaded history', result);
				this.cardHistory = result.splice(0, this.MAX_RESULTS_DISPLAYED);
				this.shownHistory = this.cardHistory;
			},
			0);
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

	// Prevent the window from being dragged around if user scrolls with click
	@HostListener('mousedown', ['$event'])
	private onHistoryClick(event: MouseEvent) {
		console.log('handling history click', event);
		let rect = this.el.nativeElement.querySelector('.history').getBoundingClientRect();
		console.log('element rect', rect);
		let scrollbarWidth = 5;
		if (event.offsetX >= rect.width - scrollbarWidth) {
			event.stopPropagation();
		}
	}
}
