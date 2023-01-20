import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { FeatureFlags } from '../../../services/feature-flags';
import { formatClass } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { ShowReplaysEvent } from '../../../services/mainwindow/store/events/replays/show-replays-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'decktracker-deck-recap',
	styleUrls: [`../../../../css/component/decktracker/main/decktracker-deck-recap.component.scss`],
	template: `
		<div class="decktracker-deck-recap" *ngIf="info$ | async as info">
			<div class="title" [owTranslate]="'app.decktracker.deck-recap.overall-stats-header'"></div>

			<div class="deck-summary">
				<div class="deck-image">
					<img class="skin" [src]="info.skin" />
					<img class="frame" src="assets/images/deck/hero_frame.png" />
				</div>
				<div class="deck-title">
					<div class="deck-name">
						<div class="text">{{ info.deckName }}</div>
						<!-- <div class="archetype" *ngIf="enableArchetype">
							<div class="name">{{ info.deckArchetype }}</div>
							<div
								class="help"
								inlineSVG="assets/svg/help.svg"
								helpTooltip="Trying to guess the deck's archetype. Don't hesitate to ping me on Discord or report a bug if it's incorrect :)"
							></div>
						</div> -->
					</div>
					<div class="replay" (click)="showReplays()">
						<div class="watch-icon">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/replays/replays_icons.svg#match_watch" />
							</svg>
						</div>
						<div class="watch" [owTranslate]="'app.decktracker.deck-recap.watch-replays-button'"></div>
					</div>
				</div>
				<div class="best-against" *ngIf="info.bestAgainsts?.length">
					<div class="header" [owTranslate]="'app.decktracker.deck-recap.best-against'"></div>
					<ul class="classes">
						<img
							class="class-icon"
							*ngFor="let bestAgainst of info.bestAgainsts"
							[src]="bestAgainst.icon"
							[helpTooltip]="bestAgainst.playerClass"
						/>
					</ul>
				</div>
			</div>
			<div class="deck-stats-recap">
				<div class="recap winrate">
					<div class="icon winrate-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/replays/replays_icons.svg#match_result_victory" />
						</svg>
					</div>
					<div class="data winrate-data">{{ info.winRatePercentage }}%</div>
					<div class="text winrate-text" [owTranslate]="'app.decktracker.deck-recap.winrate'"></div>
				</div>
				<div class="recap games">
					<div class="icon games-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#star" />
						</svg>
					</div>
					<div class="data games-data">{{ info.games }}</div>
					<div class="text games-text" [owTranslate]="'app.decktracker.deck-recap.games'"></div>
				</div>
				<deck-mana-curve class="recap mana-curve" [deckstring]="info.deckstring"></deck-mana-curve>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckRecapComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	enableArchetype: boolean = FeatureFlags.ENABLE_RANKED_ARCHETYPE;

	info$: Observable<Info>;

	private deck$: Observable<DeckSummary>;
	private deckstring: string;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.deck$ = combineLatest(
			this.store.decks$(),
			this.store.listen$(
				([main, nav, prefs]) => nav.navigationDecktracker.selectedDeckstring,
				([main, nav, prefs]) => nav.navigationDecktracker.selectedVersionDeckstring,
			),
		).pipe(
			this.mapData(([decks, [selectedDeckstring, selectedVersionDeckstring]]) => {
				const deck: DeckSummary = (decks ?? []).find(
					(deck) =>
						deck?.deckstring === selectedDeckstring ||
						(deck.allVersions?.map((v) => v.deckstring) ?? []).includes(selectedDeckstring),
				);
				return !!selectedVersionDeckstring
					? deck.allVersions?.find((v) => v.deckstring === selectedVersionDeckstring)
					: deck;
			}),
		);
		this.deck$.subscribe((deck) => (this.deckstring = deck?.deckstring));
		this.info$ = this.deck$.pipe(
			this.mapData((deck) => {
				return {
					skin: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${deck.skin}.jpg`,
					deckName: deck.deckName,
					deckArchetype: deck.deckArchetype,
					deckstring: deck.deckstring,
					winRatePercentage:
						deck.winRatePercentage != null
							? parseFloat('' + deck.winRatePercentage).toLocaleString('en-US', {
									minimumIntegerDigits: 1,
									maximumFractionDigits: 1,
							  })
							: '-',
					games: deck.totalGames,
					bestAgainsts: [...(deck.matchupStats ?? [])]
						.filter((matchup) => matchup.totalWins > 0)
						.sort((a, b) => b.totalWins / b.totalGames - a.totalWins / a.totalGames)
						.slice(0, 3)
						.map(
							(matchUp) =>
								({
									icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${matchUp.opponentClass.toLowerCase()}.png`,
									playerClass: formatClass(matchUp.opponentClass, this.i18n),
								} as BestAgainst),
						),
				};
			}),
		);
	}

	showReplays() {
		this.store.send(new ShowReplaysEvent(this.deckstring, 'ranked'));
	}
}

interface Info {
	readonly skin: string;
	readonly deckName: string;
	readonly deckArchetype: string;
	readonly deckstring: string;
	readonly winRatePercentage: string;
	readonly games: number;
	readonly bestAgainsts: readonly BestAgainst[];
}

interface BestAgainst {
	readonly icon: string;
	readonly playerClass: string;
}
