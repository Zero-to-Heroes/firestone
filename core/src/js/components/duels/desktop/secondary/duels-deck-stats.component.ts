import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DuelsDeckSummary } from '../../../../models/duels/duels-personal-deck';
import { DuelsRun } from '../../../../models/duels/duels-run';
import { DuelsState } from '../../../../models/duels/duels-state';
import { DeckSummary } from '../../../../models/mainwindow/decktracker/deck-summary';
import { NavigationDuels } from '../../../../models/mainwindow/navigation/navigation-duels';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { formatClass } from '../../../../services/hs-utils';

@Component({
	selector: 'duels-deck-stats',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-deck-stats.component.scss`,
	],
	template: `
		<div class="duels-deck-stats">
			<div class="title">Deck stats</div>
			<div class="info">
				<div class="deck-image">
					<img class="skin" [src]="skin" />
					<img class="frame" src="assets/images/deck/hero_frame.png" />
				</div>
				<div class="metadata">
					<div class="deck-name">{{ deckName }}</div>
					<copy-deckstring
						class="copy-deckstring"
						[deckstring]="deckDecklist"
						[copyText]="'Copy deck'"
					></copy-deckstring>
				</div>
			</div>
			<div class="stats">
				<div class="item winrate">
					<div class="icon" inlineSVG="assets/svg/victory_icon_deck.svg"></div>
					<div class="value">{{ winrate.toFixed(0) }}%</div>
					<div class="label">Winrate</div>
				</div>
				<div class="item runs">
					<div class="icon" inlineSVG="assets/svg/star.svg"></div>
					<div class="value">{{ runs }}</div>
					<div class="label">Runs</div>
				</div>
				<deck-mana-curve class="recap mana-curve" [deck]="deck"></deck-mana-curve>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckStatsComponent {
	@Input() set state(value: DuelsState) {
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationDuels) {
		this._navigation = value;
		this.updateValues();
	}

	skin: string;
	deckDecklist: string;
	deckName: string;
	runs: number;
	winrate: number;
	deck: DeckSummary;

	private _state: DuelsState;
	private _navigation: NavigationDuels;

	private updateValues() {
		if (!this._state?.playerStats?.personalDeckStats || !this._navigation) {
			return;
		}

		const deck: DuelsDeckSummary = this.getDeck();
		if (!deck) {
			return;
		}

		this.skin = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${deck.heroCardId}.jpg`;
		this.deckDecklist = deck.runs[0].initialDeckList;
		this.deckName = deck.deckName;
		this.runs = deck.global?.totalRunsPlayed || deck.runs.length;
		this.winrate = deck.global?.winrate || this.buildWinrate(deck);
		this.deck = {
			deckstring: this.deckDecklist,
		} as DeckSummary;
	}

	private buildWinrate(deck: DuelsDeckSummary): number {
		const games = deck.runs
			.map((run) => run.steps)
			.reduce((a, b) => a.concat(b), [])
			.filter((step) => (step as GameStat)?.opponentCardId)
			.map((step) => step as GameStat);
		return (100 * games.filter((game) => game.result === 'won').length) / games.length;
	}

	private getDeck(): DuelsDeckSummary {
		if (this._navigation.selectedPersonalDeckstring) {
			return this._state.playerStats.personalDeckStats.find(
				(deck) => deck.initialDeckList === this._navigation.selectedPersonalDeckstring,
			);
		}
		if (this._navigation.selectedDeckId) {
			const deckStat = this._state.playerStats.deckStats
				.map((grouped) => grouped.decks)
				.reduce((a, b) => a.concat(b), [])
				.filter((deck) => deck)
				.find((deck) => deck.id === this._navigation.selectedDeckId);
			if (!deckStat) {
				console.warn('[duels-deck] could not find deckstat', this._navigation.selectedDeckId);
				return null;
			}
			const additionalStat = (this._state.additionalDeckDetails ?? [])
				.filter((stat) => stat)
				.find((stat) => stat.id === deckStat.id);
			const run = {
				creationTimestamp: undefined,
				id: deckStat.runId,
				ratingAtEnd: undefined,
				ratingAtStart: undefined,
				rewards: undefined,
				heroCardId: deckStat.heroCardId,
				heroPowerCardId: deckStat.heroPowerCardId,
				initialDeckList: deckStat.decklist,
				losses: deckStat.losses,
				signatureTreasureCardId: deckStat.signatureTreasureCardId,
				type: deckStat.gameMode,
				wins: deckStat.wins,
				steps: deckStat.steps ?? additionalStat?.steps,
			};
			const runs: readonly DuelsRun[] = [run];
			return {
				deckName: `${formatClass(deckStat.playerClass)} deck`,
				initialDeckList: deckStat.decklist,
				runs: runs,
				heroCardId: deckStat.heroCardId,
				playerClass: deckStat.playerClass,
			} as DuelsDeckSummary;
		}
		return null;
	}
}
