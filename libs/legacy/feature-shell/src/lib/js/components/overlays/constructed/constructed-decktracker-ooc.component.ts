import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { decode } from '@firestone-hs/deckstrings';
import { StatsRecap } from '@firestone/game-state';
import { PatchesConfigService, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { toFormatType } from '@firestone/stats/data-access';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { combineLatest, debounceTime, distinctUntilChanged, filter, Observable, tap } from 'rxjs';
import { DeckParserFacadeService } from '../../../services/decktracker/deck-parser-facade.service';
import { DecksProviderService } from '../../../services/decktracker/main/decks-provider.service';
import { GameStatsProviderService } from '../../../services/stats/game/game-stats-provider.service';

@Component({
	selector: 'constructed-decktracker-ooc',
	styleUrls: [
		'../../../../css/component/decktracker/overlay/decktracker-overlay.component.scss',
		'./constructed-decktracker-ooc.component.scss',
	],
	template: `
		<div class="root active" [activeTheme]="'decktracker'">
			<ng-container *ngIf="deckstring$ | async as deckstring">
				<div class="decktracker-container">
					<div class="decktracker" *ngIf="!!deckstring">
						<div class="background"></div>
						<ng-container *ngIf="showDeckWinrate$ | async">
							<div class="title-bar" *ngIf="deckStatsRecap$ | async as stats">
								<decktracker-winrate-recap
									class="winrate"
									[stats]="stats"
									[type]="'deck'"
								></decktracker-winrate-recap>
							</div>
						</ng-container>
						<deck-list-static class="played-cards" [deckstring]="deckstring"> </deck-list-static>
					</div>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedDecktrackerOocComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	deckstring$: Observable<string>;
	showDeckWinrate$: Observable<boolean>;
	deckStatsRecap$: Observable<StatsRecap>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly cardsHighlight: CardsHighlightFacadeService,
		private readonly allCards: CardsFacadeService,
		private readonly deck: DeckParserFacadeService,
		private readonly prefs: PreferencesService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly gameStats: GameStatsProviderService,
		private readonly decksProvider: DecksProviderService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.deck, this.prefs, this.patchesConfig, this.gameStats, this.decksProvider);

		this.deckstring$ = this.deck.currentDeck$$.pipe(
			tap((deck) => console.debug('[constructed-decktracker-ooc] new deck', deck)),
			distinctUntilChanged((a, b) => a?.deckstring === b?.deckstring),
			this.mapData((deck) => deck?.deckstring),
		);
		this.showDeckWinrate$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.overlayShowDeckWinrate));

		const gamesForDeck$ = combineLatest([
			this.deckstring$,
			this.patchesConfig.currentConstructedMetaPatch$$,
			this.gameStats.gameStats$$,
			this.decksProvider.decks$$,
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) => ({
						desktopDeckDeletes: prefs.desktopDeckDeletes,
						desktopDeckStatsReset: prefs.desktopDeckStatsReset,
						desktopDeckHiddenDeckCodes: prefs.desktopDeckHiddenDeckCodes,
						desktopDeckShowHiddenDecks: prefs.desktopDeckShowHiddenDecks,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
		]).pipe(
			debounceTime(1000),
			filter(
				([
					deckstring,
					patch,
					gameStats,
					decks,
					{
						desktopDeckDeletes,
						desktopDeckStatsReset,
						desktopDeckHiddenDeckCodes,
						desktopDeckShowHiddenDecks,
					},
				]) => !!gameStats?.length && !!decks?.length,
			),
			this.mapData(
				([
					deckstring,
					patch,
					gameStats,
					decks,
					{
						desktopDeckDeletes,
						desktopDeckStatsReset,
						desktopDeckHiddenDeckCodes,
						desktopDeckShowHiddenDecks,
					},
				]) => {
					const decoded = decode(deckstring);
					const formatType = toFormatType(decoded.format);
					const result = DecksProviderService.buildValidReplays(
						deckstring,
						gameStats,
						formatType,
						'ranked',
						'last-patch',
						'all',
						patch,
						desktopDeckDeletes,
						desktopDeckStatsReset,
						desktopDeckHiddenDeckCodes,
						desktopDeckShowHiddenDecks,
						decks,
					);
					console.debug('[constructed-decktracker-ooc] gamesForDeck', result);
					return result;
				},
			),
		);
		this.deckStatsRecap$ = gamesForDeck$.pipe(
			filter((games) => !!games?.length),
			this.mapData((gameStats) => StatsRecap.from(gameStats)),
			tap((stats) => console.debug('[constructed-decktracker-ooc] new stats', stats)),
		);

		this.cardsHighlight.initForSingle();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
