import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { CardPackResult, PackResult } from '@firestone-hs/user-packs';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, filter, tap } from 'rxjs';
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
					<div class="title-container">
						<div
							class="title"
							[owTranslate]="'app.collection.card-history.title'"
							[helpTooltip]="'app.collection.card-history.click-to-show-stats' | owTranslate"
							(click)="toggleStatsView()"
						></div>
					</div>
					<div class="caret" inlineSVG="assets/svg/caret.svg"></div>
					<section class="toggle-label">
						<preference-toggle
							field="collectionHistoryShowOnlyNewCards"
							[label]="'settings.collection.history-show-only-new-cards' | owTranslate"
						></preference-toggle>
					</section>
				</div>
				<ul class="history-list" scrollable *ngIf="{ cardHistory: cardHistory$ | async } as value">
					<li *ngFor="let historyItem of shownHistory$ | async; trackBy: trackById">
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
				</ul>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHistoryComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	private readonly MAX_RESULTS_DISPLAYED = 300;

	showOnlyNewCards$: Observable<boolean>;
	shownHistory$: Observable<readonly CardHistory[]>;
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
		const fullHistory$ = this.store.packStats$().pipe(
			tap((info) => console.log('card history 0', info)),
			distinctUntilChanged((a, b) => a?.length === b?.length && a[0]?.creationDate === b[0]?.creationDate),
			tap((info) => console.log('card history 0 - 1', info)),
			this.mapData((packStats) => this.buildHistory(packStats)),
			tap((info) => console.log('card history 0 - 2', info)),
		);
		const sets$ = this.sets$$.asObservable().pipe(
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			this.mapData((sets) => sets),
		);
		this.cardHistory$ = combineLatest([sets$, fullHistory$]).pipe(
			tap((info) => console.log('card history', info)),
			filter(([currentSets, cardHistory]) => !!currentSets?.length && !!cardHistory?.length),
			tap((info) => console.log('card history 2', info)),
			this.mapData(([currentSets, cardHistory]) => {
				return cardHistory
					.filter(
						(card: CardHistory) =>
							!currentSets?.length || currentSets.find((set) => set.getCard(card.cardId)),
					)
					.slice(0, this.MAX_RESULTS_DISPLAYED);
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

	private buildHistory(packStats: readonly PackResult[]): readonly CardHistory[] {
		return packStats.flatMap((pack) => pack.cards.map((card) => this.buildCardHistory(card, pack.creationDate)));
	}

	private buildCardHistory(card: CardPackResult, creationTimestamp: number): CardHistory {
		const result: CardHistory = {
			cardId: card.cardId,
			isPremium: card.cardType === 'GOLDEN',
			isNewCard: card.isNew || card.isSecondCopy,
			relevantCount: card.isNew ? 1 : card.isSecondCopy ? 2 : -1,
			creationTimestamp: creationTimestamp,
		};
		return result;
	}
}
