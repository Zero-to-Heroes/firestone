import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { DuelsDeckSummary } from '../../../models/duels/duels-personal-deck';
import { AppUiStoreService, cdLog } from '../../../services/ui-store/app-ui-store.service';
import { filterDuelsRuns } from '../../../services/ui-store/duels-ui-helper';

@Component({
	selector: 'duels-personal-decks',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/duels/desktop/duels-personal-decks.component.scss`,
	],
	template: `
		<div *ngIf="decks$ | async as decks; else emptyState" class="duels-decks">
			<duels-personal-deck-vignette
				class="item"
				*ngFor="let deck of decks; trackBy: trackByDeck"
				[deck]="deck"
			></duels-personal-deck-vignette>
		</div>
		<ng-template #emptyState>
			<duels-empty-state></duels-empty-state>
		</ng-template>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsPersonalDecksComponent {
	decks$: Observable<readonly DuelsDeckSummary[]>;

	constructor(private readonly store: AppUiStoreService, private readonly cdr: ChangeDetectorRef) {
		this.decks$ = this.store
			.listen$(
				([main, nav]) => main.duels.personalDeckStats,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksClassFilter,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsPersonalDeckNames,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch?.number,
			)
			.pipe(
				filter(([decks, timeFilter, classFilter, gameMode, deckNames, lastPatchNumber]) => !!decks?.length),
				map(([decks, timeFilter, classFilter, gameMode, deckNames, lastPatchNumber]) =>
					decks
						.map((deck) => {
							return {
								...deck,
								runs: filterDuelsRuns(deck.runs, timeFilter, classFilter, gameMode, lastPatchNumber, 0),
								deckName: deckNames[deck.initialDeckList] ?? deck.deckName,
							};
						})
						.filter((deck) => !!deck.runs.length),
				),
				map((decks) => (!!decks.length ? decks : null)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((info) => cdLog('emitting personal decks in ', this.constructor.name, info)),
			);
	}

	trackByDeck(index: number, deck: DuelsDeckSummary): string {
		return deck.initialDeckList;
	}
}
