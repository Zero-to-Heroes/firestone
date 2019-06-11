import { Component, Input, ElementRef, HostListener, ChangeDetectionStrategy, AfterViewInit, EventEmitter } from '@angular/core';

import { CardHistory } from '../../models/card-history';
import { SetCard } from '../../models/set';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { LoadMoreCardHistoryEvent } from '../../services/mainwindow/store/events/collection/load-more-card-history-event';
import { ToggleShowOnlyNewCardsInHistoryEvent } from '../../services/mainwindow/store/events/collection/toggle-show-only-new-cards-in-history-event';

declare var overwolf: any;

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
					<button class="load-more-button" (mousedown)="loadMore()">Load More</button>
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
	
	_selectedCard: SetCard;
	@Input() showOnlyNewCards: boolean;
	@Input() cardHistory: ReadonlyArray<CardHistory>;
	@Input() shownHistory: ReadonlyArray<CardHistory>;
	@Input() totalHistoryLength: number;
	
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set selectedCard(selectedCard: SetCard) {
		this._selectedCard = selectedCard;
	}

	constructor(private el: ElementRef) { }

	ngAfterViewInit() {
		this.stateUpdater = overwolf.windows.getMainWindow().mainWindowStoreUpdater;
	}

	loadMore() {
		this.stateUpdater.next(new LoadMoreCardHistoryEvent(this.MAX_RESULTS_DISPLAYED));
	}

	toggleShowOnlyNewCards() {
		this.stateUpdater.next(new ToggleShowOnlyNewCardsInHistoryEvent());
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
