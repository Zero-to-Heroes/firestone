import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardHistory } from '../../models/card-history';
import { BinderState } from '../../models/mainwindow/binder-state';
import { SetCard } from '../../models/set';
import { LoadMoreCardHistoryEvent } from '../../services/mainwindow/store/events/collection/load-more-card-history-event';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'card-history',
	styleUrls: [
		`../../../css/global/scrollbar.scss`,
		`../../../css/global/forms.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/collection/card-history.component.scss`,
	],
	template: `
		<div class="card-history">
			<div class="history">
				<div class="top-container">
					<span class="title">My Card History</span>
					<section class="toggle-label">
						<preference-toggle
							field="collectionHistoryShowOnlyNewCards"
							label="Show only new cards"
						></preference-toggle>
					</section>
				</div>
				<ul scrollable>
					<li *ngFor="let historyItem of shownHistory; trackBy: trackById">
						<card-history-item
							[historyItem]="historyItem"
							[active]="(_selectedCard && _selectedCard.id === historyItem.cardId) || false"
						>
						</card-history-item>
					</li>
					<li *ngIf="cardHistory && cardHistory.length < totalHistoryLength" class="more-data-container">
						<span class="more-data-text"
							>You've viewed {{ cardHistory.length }} of {{ totalHistoryLength }} cards</span
						>
						<button class="load-more-button" (mousedown)="loadMore()">Load More</button>
					</li>
					<section *ngIf="!cardHistory || cardHistory.length === 0" class="empty-state">
						<i class="i-60x78 pale-theme">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#empty_state_my_card_history" />
							</svg>
						</i>
						<span>No history yet</span>
						<span>Open a pack to start one!</span>
					</section>
				</ul>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHistoryComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	private readonly MAX_RESULTS_DISPLAYED = 1000;

	@Input() set state(value: BinderState) {
		this._state = value;
		this.cardHistory = value.cardHistory;
		this.totalHistoryLength = value.totalHistoryLength;
		this.updateInfos();
	}

	@Input() set selectedCard(selectedCard: SetCard) {
		this._selectedCard = selectedCard;
		this.updateInfos();
	}

	_state: BinderState;
	totalHistoryLength: number;
	cardHistory: readonly CardHistory[];
	shownHistory: readonly CardHistory[];
	_selectedCard: SetCard;
	_showOnlyNewCards: boolean;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.listenForBasicPref$((prefs) => prefs.collectionHistoryShowOnlyNewCards).subscribe((value) => {
			this._showOnlyNewCards = value;
			this.updateInfos();
		});
	}

	loadMore() {
		this.store.send(new LoadMoreCardHistoryEvent(this.MAX_RESULTS_DISPLAYED));
	}

	trackById(index, history: CardHistory) {
		return history.creationTimestamp;
	}

	private updateInfos() {
		if (!this._state) {
			return;
		}

		this.shownHistory = this._state.cardHistory.filter(
			(card: CardHistory) => !this._showOnlyNewCards || card.isNewCard,
		);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
