import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { DeckInfo, getCurrentDeck } from '../../../../services/ui-store/duels-ui-helper';

@Component({
	selector: 'duels-deck-stats',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-deck-stats.component.scss`,
	],
	template: `
		<div class="duels-deck-stats" *ngIf="deckInfo$ | async as deckInfo">
			<div class="title">Deck stats</div>
			<div class="info">
				<div class="deck-image">
					<img class="skin" [src]="deckInfo.deck.skin" />
					<img class="frame" src="assets/images/deck/hero_frame.png" />
				</div>
				<div class="metadata">
					<div class="deck-name">{{ deckInfo.deck.deckName }}</div>
					<copy-deckstring
						class="copy-deckstring"
						[deckstring]="deckInfo.deck.initialDeckList"
						[copyText]="'Copy deck'"
					></copy-deckstring>
				</div>
			</div>
			<div class="stats">
				<div class="item winrate">
					<div class="icon" inlineSVG="assets/svg/victory_icon_deck.svg"></div>
					<div class="value">
						{{ deckInfo.deck.winrate != null ? deckInfo.deck.winrate.toFixed(0) + '%' : '--' }}
					</div>
					<div class="label">Winrate</div>
				</div>
				<div class="item runs">
					<div class="icon" inlineSVG="assets/svg/star.svg"></div>
					<div class="value">{{ deckInfo.deck.runs?.length }}</div>
					<div class="label">Runs</div>
				</div>
				<deck-mana-curve
					class="recap mana-curve"
					[deckstring]="deckInfo.deck.initialDeckList"
				></deck-mana-curve>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckStatsComponent {
	deckInfo$: Observable<DeckInfo>;

	constructor(private readonly store: AppUiStoreService, private readonly cdr: ChangeDetectorRef) {
		this.deckInfo$ = this.store
			.listen$(
				([main, nav]) => main.duels.personalDeckStats,
				([main, nav]) => main.duels.topDecks,
				([main, nav]) => main.duels.additionalDeckDetails,
				([main, nav]) => nav.navigationDuels.selectedPersonalDeckstring,
				([main, nav]) => nav.navigationDuels.selectedDeckId,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksClassFilter,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch?.number,
			)
			.pipe(
				filter(
					([
						decks,
						topDecks,
						deckDetails,
						deckstring,
						deckId,
						timeFilter,
						classFilter,
						gameMode,
						patchNumber,
					]) => (!!deckstring?.length && !!decks?.length) || (deckId && !!topDecks?.length),
				),
				map(
					([
						decks,
						topDecks,
						deckDetails,
						deckstring,
						deckId,
						timeFilter,
						classFilter,
						gameMode,
						patchNumber,
					]) =>
						getCurrentDeck(
							decks,
							deckstring,
							topDecks,
							deckId,
							timeFilter,
							classFilter,
							gameMode,
							patchNumber,
							0,
							deckDetails,
						),
				),
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting deck in ', this.constructor.name, info)),
			);
	}
}
