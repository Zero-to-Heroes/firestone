import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { SetCard } from '../../../models/set';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { DeckInfo, getCurrentDeck } from '../../../services/ui-store/duels-ui-helper';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'duels-personal-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-personal-deck-details.component.scss`,
	],
	template: `
		<div
			class="duels-personal-deck-details"
			*ngIf="deck$ | async as deck"
			[ngClass]="{ 'top-deck': !deck.personal }"
		>
			<div class="deck-list-container" *ngIf="currentDeck$ | async as currentDeck">
				<ng-container *ngIf="{ expandedRunIds: expandedRunIds$ | async } as value">
					<div class="deck-selection">
						<input
							type="radio"
							name="deck"
							id="initial"
							value="initial"
							[checked]="currentDeck === 'initial'"
							(change)="changeCurrentDeck($event)"
						/>
						<label for="initial">
							<div class="icon unchecked" inlineSVG="assets/svg/radio_button.svg"></div>
							<div class="icon checked" inlineSVG="assets/svg/radio_button_checked.svg"></div>
							{{ 'app.duels.deck-stat.starter-deck' | owTranslate }}
						</label>

						<input
							type="radio"
							name="deck"
							id="final"
							value="final"
							[checked]="currentDeck === 'final'"
							(change)="changeCurrentDeck($event)"
							[disabled]="value.expandedRunIds?.length !== 1"
						/>
						<label
							for="final"
							class="final"
							[ngClass]="{ 'disabled': value.expandedRunIds?.length !== 1 }"
							[helpTooltip]="
								value.expandedRunIds?.length !== 1
									? 'Please expand a single run on the right column to view its final decklist'
									: null
							"
						>
							<div class="icon unchecked" inlineSVG="assets/svg/radio_button.svg"></div>
							<div class="icon checked" inlineSVG="assets/svg/radio_button_checked.svg"></div>
							{{ 'app.duels.deck-stat.final-deck' | owTranslate }}
						</label>
					</div>
				</ng-container>
				<deck-list
					class="deck-list"
					[deckstring]="decklist$ | async"
					[collection]="collection$ | async"
				></deck-list>
			</div>
			<div class="stats" scrollable *ngIf="deck.personal">
				<div
					class="header"
					[owTranslate]="'app.duels.deck-stat.all-runs-with-deck'"
					[translateParams]="{ deckName: deck.deck.deckName }"
				></div>
				<duels-runs-list
					[deckstring]="deck.deck.initialDeckList"
					[displayLoot]="true"
					[displayShortLoot]="false"
				></duels-runs-list>
			</div>
			<div class="stats" *ngIf="!deck.personal" scrollable>
				<div class="header" [owTranslate]="'app.duels.deck-stat.run-details'"></div>
				<duels-run [run]="deck.run" [displayLoot]="true" [isExpanded]="true"></duels-run>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsPersonalDeckDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	deck$: Observable<DeckInfo>;
	collection$: Observable<readonly SetCard[]>;
	decklist$: Observable<string>;
	expandedRunIds$: Observable<readonly string[]>;

	currentDeck = new BehaviorSubject<'initial' | 'final'>('initial');
	currentDeck$: Observable<'initial' | 'final'> = this.currentDeck.asObservable();
	currentRunIndex = new BehaviorSubject<number>(0);

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.expandedRunIds$ = this.store
			.listen$(([main, nav]) => nav.navigationDuels.expandedRunIds)
			.pipe(this.mapData(([runIds]) => runIds));
		this.collection$ = combineLatest(
			this.currentDeck.asObservable(),
			this.store.listen$(([main, nav]) => main.binder.allSets),
		).pipe(
			this.mapData(([currentDeck, [allSets]]) =>
				currentDeck === 'final'
					? null
					: (allSets.map((set) => set.allCards).reduce((a, b) => a.concat(b), []) as readonly SetCard[]),
			),
		);
		this.deck$ = combineLatest(
			this.store.duelsDecks$(),
			this.store.listen$(
				([main, nav]) => main.duels.topDecks,
				([main, nav]) => main.duels.additionalDeckDetails,
				([main, nav]) => nav.navigationDuels.selectedPersonalDeckstring,
				([main, nav]) => nav.navigationDuels.selectedDeckId,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsDeckDeletes,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
			),
		).pipe(
			filter(
				([decks, [topDecks, deckDetails, deckstring, deckId, timeFilter, classFilter, gameMode, patch]]) =>
					(!!deckstring?.length && !!decks?.length) || (deckId && !!topDecks?.length),
			),
			this.mapData(
				([
					decks,
					[
						topDecks,
						deckDetails,
						deckstring,
						deckId,
						timeFilter,
						heroesFilter,
						gameMode,
						duelsDeckDeletes,
						patch,
					],
				]) =>
					getCurrentDeck(
						decks,
						deckstring,
						topDecks,
						deckId,
						timeFilter,
						heroesFilter,
						gameMode,
						duelsDeckDeletes,
						patch,
						0,
						deckDetails,
					),
			),
		);
		this.decklist$ = combineLatest(
			this.deck$,
			this.expandedRunIds$,
			this.currentDeck$,
			this.currentRunIndex.asObservable(),
		).pipe(
			this.mapData(([deck, expandedRunIds, currentDeck, currentRunIndex]) => {
				const result =
					currentDeck === 'initial'
						? deck.deck.initialDeckList
						: this.getFinalDecklist(deck, expandedRunIds, currentRunIndex);

				// FIXME: for some reason this is necessary here
				setTimeout(() => this.cdr?.detectChanges(), 0);
				return result;
			}),
		);
	}

	changeCurrentDeck(event) {
		if (this.currentDeck.value === 'initial') {
			this.currentDeck.next('final');
		} else {
			this.currentDeck.next('initial');
		}
	}

	private getFinalDecklist(deck: DeckInfo, expandedRunIds: readonly string[], currentRunIndex: number) {
		const currentRun = deck.deck.runs[currentRunIndex];
		const runMatches: readonly GameStat[] = (currentRun?.steps ?? [])
			.filter((step) => (step as GameStat).playerDecklist)
			.map((step) => step as GameStat);
		const result = runMatches.length > 0 ? runMatches[runMatches.length - 1].playerDecklist : null;
		return result;
	}
}
