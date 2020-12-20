import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DuelsState } from '../../../../models/duels/duels-state';
import { DeckSummary } from '../../../../models/mainwindow/decktracker/deck-summary';
import { NavigationDuels } from '../../../../models/mainwindow/navigation/navigation-duels';

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
					<div class="value">{{ winrate }}%</div>
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

		const deck = this._state.playerStats.personalDeckStats.find(
			deck => deck.initialDeckList === this._navigation.selectedPersonalDeckstring,
		);
		if (!deck) {
			return;
		}

		this.skin = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${deck.heroCardId}.jpg`;
		this.deckDecklist = deck.runs[0].initialDeckList;
		this.deckName = deck.deckName;
		this.runs = deck.global.totalRunsPlayed;
		this.winrate = deck.global.winrate;
		this.deck = {
			deckstring: this.deckDecklist,
		} as DeckSummary;
	}
}
