import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { FeatureFlags } from '../../../services/feature-flags';
import { formatClass } from '../../../services/hs-utils';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { ReplaysFilterEvent } from '../../../services/mainwindow/store/events/replays/replays-filter-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'decktracker-deck-recap',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-deck-recap.component.scss`,
	],
	template: `
		<div class="decktracker-deck-recap">
			<div class="title">Overall stats</div>

			<div class="deck-summary">
				<div class="deck-image">
					<img class="skin" [src]="skin" />
					<img class="frame" src="assets/images/deck/hero_frame.png" />
				</div>
				<div class="deck-title">
					<div class="deck-name">
						<div class="text">{{ deckName }}</div>
						<div class="archetype" *ngIf="enableArchetype">
							<div class="name">{{ deckArchetype }}</div>
							<div
								class="help"
								inlineSVG="assets/svg/help.svg"
								helpTooltip="Trying to guess the deck's archetype. Don't hesitate to ping me on Discord or report a bug if it's incorrect :)"
							></div>
						</div>
					</div>
					<div class="replay" (click)="showReplays()">
						<div class="watch-icon">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/replays/replays_icons.svg#match_watch" />
							</svg>
						</div>
						<div class="watch">Watch replays</div>
					</div>
				</div>
				<div class="best-against" *ngIf="bestAgainsts?.length">
					<div class="header">Best against</div>
					<ul class="classes">
						<img
							class="class-icon"
							*ngFor="let bestAgainst of bestAgainsts"
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
					<div class="data winrate-data">{{ winRatePercentage }}%</div>
					<div class="text winrate-text">winrate</div>
				</div>
				<div class="recap games">
					<div class="icon games-icon">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#star" />
						</svg>
					</div>
					<div class="data games-data">{{ games }}</div>
					<div class="text games-text">games</div>
				</div>
				<deck-mana-curve class="recap mana-curve" [deck]="deck"></deck-mana-curve>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckRecapComponent implements AfterViewInit {
	enableArchetype: boolean = FeatureFlags.ENABLE_RANKED_ARCHETYPE;

	@Input() set state(value: MainWindowState) {
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.updateValues();
	}

	// cards: readonly VisualDeckCard[];
	deck: DeckSummary;
	skin: string;
	deckName: string;
	deckArchetype: string;
	deckstring: string;
	winRatePercentage: string;
	games: number;
	bestAgainsts: readonly BestAgainst[];

	private _state: MainWindowState;
	private _navigation: NavigationState;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	showReplays() {
		this.stateUpdater.next(new ReplaysFilterEvent('deckstring', this.deck.deckstring));
	}

	private updateValues() {
		if (!this._state?.decktracker?.decks || !this._navigation?.navigationDecktracker) {
			return;
		}

		this.deck = this._state.decktracker.decks.find(
			(deck) => deck.deckstring === this._navigation.navigationDecktracker.selectedDeckstring,
		);
		if (!this.deck) {
			return;
		}

		this.skin = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.deck.skin}.jpg`;
		this.deckName = this.deck.deckName;
		this.deckArchetype = this.deck.deckArchetype;
		this.deckstring = this.deck.deckstring;
		this.winRatePercentage =
			this.deck.winRatePercentage != null
				? parseFloat('' + this.deck.winRatePercentage).toLocaleString('en-US', {
						minimumIntegerDigits: 1,
						maximumFractionDigits: 1,
				  })
				: '-';
		this.games = this.deck.totalGames;
		this.bestAgainsts = null;

		setTimeout(() => {
			if (!this.deck) {
				return;
			}
			this.bestAgainsts = [...this.deck.matchupStats]
				.filter((matchup) => matchup.totalWins > 0)
				.sort((a, b) => b.totalWins / b.totalGames - a.totalWins / a.totalGames)
				.slice(0, 3)
				.map(
					(matchUp) =>
						({
							icon: `assets/images/deck/classes/${matchUp.opponentClass.toLowerCase()}.png`,
							playerClass: formatClass(matchUp.opponentClass),
						} as BestAgainst),
				);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}
}

interface BestAgainst {
	readonly icon: string;
	readonly playerClass: string;
}
