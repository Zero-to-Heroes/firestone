import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { DeckSortType } from '../../../models/mainwindow/decktracker/deck-sort.type';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'decktracker-decks',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-decks.component.scss`,
	],
	template: `
		<div class="decktracker-decks" *ngIf="decks$ | async as decks">
			<ul class="deck-list" scrollable [attr.aria-label]="'Constructed deck stats'" role="list">
				<li *ngFor="let deck of decks">
					<decktracker-deck-summary [deck]="deck" role="listitem"></decktracker-deck-summary>
				</li>
			</ul>
			<section class="empty-state" *ngIf="!decks || decks.length === 0">
				<div class="state-container">
					<i class="i-236X165">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
						</svg>
					</i>
					<span class="title" [owTranslate]="'app.decktracker.decks.empty-state-title'"></span>
					<span class="subtitle" [owTranslate]="'app.decktracker.decks.empty-state-subtitle'"></span>
				</div>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDecksComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	decks$: Observable<readonly DeckSummary[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.decks$ = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => main.decktracker.decks,
				([main, nav, prefs]) => prefs.desktopDeckFilters?.sort,
			),
			this.store.listenPrefs$((prefs) => prefs.constructedDecksSearchString),
		).pipe(
			this.mapData(([[decks, sort], [search]]) =>
				(decks?.filter((deck) => deck.totalGames > 0 || deck.isPersonalDeck) ?? [])
					.filter(
						(deck) =>
							!search?.length ||
							deck.deckName?.toLowerCase()?.includes(search) ||
							deck.class?.toLowerCase()?.includes(search) ||
							this.i18n.translateString(`global.class.deck.class`)?.toLowerCase()?.includes(search),
					)
					.sort(this.getSortFunction(sort)),
			),
		);
	}

	private getSortFunction(sort: DeckSortType): (a: DeckSummary, b: DeckSummary) => number {
		switch (sort) {
			case 'games-played':
				return (a: DeckSummary, b: DeckSummary) => {
					if (a.totalGames <= b.totalGames) {
						return 1;
					}
					return -1;
				};
			case 'winrate':
				return (a: DeckSummary, b: DeckSummary) => {
					if (a.winRatePercentage <= b.winRatePercentage) {
						return 1;
					}
					return -1;
				};
			case 'last-played':
			default:
				return (a: DeckSummary, b: DeckSummary) => {
					if (a.lastUsedTimestamp <= b.lastUsedTimestamp) {
						return 1;
					}
					return -1;
				};
		}
	}
}
