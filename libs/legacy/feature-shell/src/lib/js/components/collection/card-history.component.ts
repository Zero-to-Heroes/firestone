import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, filter } from 'rxjs';
import { CardHistory } from '../../models/card-history';
import { Preferences } from '../../models/preferences';
import { Set } from '../../models/set';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { deepEqual } from '../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../abstract-subscription-store.component';

@Component({
	selector: 'card-history',
	styleUrls: [
		`../../../css/global/forms.scss`,
		`../../../css/global/toggle.scss`,
		`../../../css/component/collection/card-history.component.scss`,
	],
	template: `
		<div class="card-history">
			<div class="history">
				<div class="top-container">
					<div
						class="title-container"
						[helpTooltip]="'app.collection.card-history.click-to-show-stats' | owTranslate"
						(click)="toggleStatsView()"
					>
						<div class="title" [owTranslate]="'app.collection.card-history.title'"></div>
						<div class="caret" inlineSVG="assets/svg/restore.svg"></div>
					</div>
					<section class="toggle-label">
						<preference-toggle
							field="collectionHistoryShowOnlyNewCards"
							[label]="'settings.collection.history-show-only-new-cards' | owTranslate"
						></preference-toggle>
					</section>
				</div>
				<virtual-scroller
					#scroll
					*ngIf="{ cardHistory: cardHistory$ | async, shownHistory: shownHistory$ | async } as value"
					[items]="value.shownHistory"
					[bufferAmount]="50"
					class="history-list"
					scrollable
				>
					<li *ngFor="let historyItem of scroll.viewPortItems; trackBy: trackById">
						<card-history-item [historyItem]="historyItem"> </card-history-item>
					</li>
					<section *ngIf="!value.cardHistory || value.cardHistory.length === 0" class="empty-state">
						<i class="i-60x78 pale-theme">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#empty_state_my_card_history" />
							</svg>
						</i>
						<span [owTranslate]="'app.collection.card-history.empty-state-title'"></span>
						<span [owTranslate]="'app.collection.card-history.empty-state-subtitle'"></span>
					</section>
				</virtual-scroller>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHistoryComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	private readonly MAX_RESULTS_DISPLAYED = 300;

	showOnlyNewCards$: Observable<boolean>;
	shownHistory$: Observable<CardHistory[]>;
	cardHistory$: Observable<readonly CardHistory[]>;

	@Input() set sets(value: readonly Set[]) {
		this.sets$$.next(value);
	}

	private sets$$ = new BehaviorSubject<readonly Set[]>([]);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.showOnlyNewCards$ = this.listenForBasicPref$((prefs) => prefs.collectionHistoryShowOnlyNewCards);
		const sets$ = this.sets$$.asObservable().pipe(
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			this.mapData((sets) => sets),
		);
		this.cardHistory$ = combineLatest([sets$, this.store.cardHistory$()]).pipe(
			filter(([currentSets, cardHistory]) => !!currentSets?.length && !!cardHistory?.length),
			this.mapData(([currentSets, cardHistory]) => {
				return cardHistory.filter(
					(card: CardHistory) => !currentSets?.length || currentSets.find((set) => set.getCard(card.cardId)),
				);
				// .slice(0, this.MAX_RESULTS_DISPLAYED);
			}),
		);
		this.shownHistory$ = combineLatest([this.showOnlyNewCards$, this.cardHistory$]).pipe(
			this.mapData(([showOnlyNewCards, cardHistory]) =>
				cardHistory.filter((card: CardHistory) => !showOnlyNewCards || card.isNewCard),
			),
		);
	}

	trackById(index, history: CardHistory) {
		return history.creationTimestamp;
	}

	async toggleStatsView() {
		const prefs = await this.prefs.getPreferences();
		const newStatsView = prefs.collectionSetStatsTypeFilter === 'cards-stats' ? 'cards-history' : 'cards-stats';
		const newPrefs: Preferences = {
			...prefs,
			collectionSetStatsTypeFilter: newStatsView,
		};
		await this.prefs.savePreferences(newPrefs);
	}
}
