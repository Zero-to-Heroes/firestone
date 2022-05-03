import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DuelsDeckSummary } from '../../../models/duels/duels-personal-deck';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { filterDuelsRuns } from '../../../services/ui-store/duels-ui-helper';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

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
export class DuelsPersonalDecksComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	decks$: Observable<readonly DuelsDeckSummary[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.decks$ = this.store
			.listen$(
				([main, nav]) => main.duels.personalDeckStats,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsPersonalDeckNames,
				([main, nav, prefs]) => prefs.duelsPersonalDeckHiddenDeckCodes,
				([main, nav, prefs]) => prefs.duelsPersonalDeckShowHiddenDecks,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
			)
			.pipe(
				filter(
					([decks, timeFilter, classFilter, gameMode, deckNames, hiddenCodes, showHidden, patch]) =>
						!!decks?.length,
				),
				map(([decks, timeFilter, classFilter, gameMode, deckNames, hiddenCodes, showHidden, patch]) =>
					decks
						.filter(
							(deck) => !hiddenCodes?.length || showHidden || !hiddenCodes.includes(deck.initialDeckList),
						)
						.map((deck) => {
							return {
								...deck,
								runs: filterDuelsRuns(deck.runs, timeFilter, classFilter, gameMode, patch, 0),
								deckName:
									deckNames[deck.initialDeckList] ??
									deck.deckName ??
									this.i18n.translateString('decktracker.deck-name.unnamed-deck'),
								hidden: hiddenCodes?.includes(deck.initialDeckList),
							};
						})
						.filter((deck) => !!deck.runs?.length || deck.isPersonalDeck),
				),
				this.mapData((decks) => (!!decks.length ? decks : null)),
			);
	}

	trackByDeck(index: number, deck: DuelsDeckSummary): string {
		return deck.initialDeckList;
	}
}
