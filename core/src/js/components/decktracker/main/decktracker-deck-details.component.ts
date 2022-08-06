import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'decktracker-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-deck-details.component.scss`,
	],
	template: `
		<div class="decktracker-deck-details" *ngIf="{ deck: deck$ | async } as value">
			<decktracker-stats-for-replays
				class="global-stats"
				[replays]="replays$ | async"
			></decktracker-stats-for-replays>
			<div class="container">
				<div
					class="deck-versions"
					*ngIf="value.deck?.allVersions?.length && value.deck?.allVersions?.length > 1"
				>
					<div class="header">Deck versions</div>
					<div
						class="version"
						*ngFor="let version of value.deck.allVersions"
						[ngClass]="{ 'inactive': !version.totalGames }"
					>
						<div class="background-image" [style.background-image]="version.backgroundImage"></div>
						<div class="deck-name">{{ version.deckName }}</div>
						<div class="matches-played">{{ version.totalGames }}</div>
						<div
							class="eject-version-button"
							inlineSVG="assets/svg/close.svg"
							(click)="ejectVersion(version)"
						></div>
					</div>
				</div>
				<div class="deck-list-container">
					<copy-deckstring
						class="copy-deckcode"
						[deckstring]="value.deck?.deckstring"
						[copyText]="'app.decktracker.deck-details.copy-deck-code-button' | owTranslate"
					>
					</copy-deckstring>
					<deck-list class="deck-list" [deckstring]="value.deck?.deckstring"></deck-list>
				</div>
				<deck-winrate-matrix
					[deck]="value.deck"
					[showMatchupAsPercentagesValue]="showMatchupAsPercentages$ | async"
				>
				</deck-winrate-matrix>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckDetailsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	replays$: Observable<readonly GameStat[]>;
	deck$: Observable<DeckSummary>;
	showMatchupAsPercentages$: Observable<boolean>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.deck$ = this.store
			.listen$(
				([main, nav, prefs]) => main.decktracker.decks,
				([main, nav, prefs]) => nav.navigationDecktracker.selectedDeckstring,
			)
			.pipe(
				this.mapData(([decks, selectedDeckstring]) =>
					decks.find(
						(deck) =>
							deck.deckstring === selectedDeckstring ||
							(deck.allVersions?.map((v) => v.deckstring) ?? []).includes(selectedDeckstring),
					),
				),
			);
		this.replays$ = this.deck$.pipe(this.mapData((deck) => deck?.replays ?? []));
		this.showMatchupAsPercentages$ = this.listenForBasicPref$((prefs) => prefs.desktopDeckShowMatchupAsPercentages);
	}

	ejectVersion(version: DeckSummary) {
		console.debug('ejecting version', version);
	}
}
