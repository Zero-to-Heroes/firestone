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
					decks.find((deck) => deck.deckstring === selectedDeckstring),
				),
			);
		this.replays$ = this.deck$.pipe(this.mapData((deck) => deck?.replays ?? []));
		this.showMatchupAsPercentages$ = this.listenForBasicPref$((prefs) => prefs.desktopDeckShowMatchupAsPercentages);
	}
}
