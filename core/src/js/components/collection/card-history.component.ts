import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { CardHistory } from '../../models/card-history';
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
				<ul
					scrollable
					*ngIf="{
						cardHistory: cardHistory$ | async,
						totalHistoryLength: totalHistoryLength$ | async
					} as value"
				>
					<li *ngFor="let historyItem of shownHistory$ | async; trackBy: trackById">
						<card-history-item [historyItem]="historyItem" [active]="historyItem.active">
						</card-history-item>
					</li>
					<li
						*ngIf="value.cardHistory && value.cardHistory.length < value.totalHistoryLength"
						class="more-data-container"
					>
						<span class="more-data-text"
							>You've viewed {{ value.cardHistory.length }} of {{ value.totalHistoryLength }} cards</span
						>
						<button class="load-more-button" (mousedown)="loadMore()">Load More</button>
					</li>
					<section *ngIf="!value.cardHistory || value.cardHistory.length === 0" class="empty-state">
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

	@Input() set selectedCard(selectedCard: SetCard) {
		this.selectedCard$$.next(selectedCard);
	}

	showOnlyNewCards$: Observable<boolean>;
	shownHistory$: Observable<readonly InternalCardHistory[]>;
	cardHistory$: Observable<readonly CardHistory[]>;
	totalHistoryLength$: Observable<number>;

	selectedCard$$ = new BehaviorSubject<SetCard>(null);

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showOnlyNewCards$ = this.listenForBasicPref$((prefs) => prefs.collectionHistoryShowOnlyNewCards);
		this.cardHistory$ = this.store
			.listen$(([main, nav, prefs]) => main.binder.cardHistory)
			.pipe(this.mapData(([cardHistory]) => cardHistory));
		this.totalHistoryLength$ = this.store
			.listen$(([main, nav, prefs]) => main.binder.totalHistoryLength)
			.pipe(this.mapData(([totalHistoryLength]) => totalHistoryLength));
		this.shownHistory$ = combineLatest(
			this.showOnlyNewCards$,
			this.selectedCard$$.asObservable(),
			this.cardHistory$,
		).pipe(
			this.mapData(([showOnlyNewCards, selectedCard, cardHistory]) =>
				cardHistory
					.filter((card: CardHistory) => !showOnlyNewCards || card.isNewCard)
					.map(
						(history) =>
							({
								...history,
								active: selectedCard && selectedCard.id === history.cardId,
							} as InternalCardHistory),
					),
			),
		);
	}

	loadMore() {
		this.store.send(new LoadMoreCardHistoryEvent(this.MAX_RESULTS_DISPLAYED));
	}

	trackById(index, history: CardHistory) {
		return history.creationTimestamp;
	}
}

interface InternalCardHistory extends CardHistory {
	readonly active: boolean;
}
