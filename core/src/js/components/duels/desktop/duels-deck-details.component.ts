import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { DuelsDeckStat } from '../../../models/duels/duels-player-stats';
import { DuelsState } from '../../../models/duels/duels-state';
import { NavigationDuels } from '../../../models/mainwindow/navigation/navigation-duels';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { OwUtilsService } from '../../../services/plugins/ow-utils.service';

@Component({
	selector: 'duels-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-deck-details.component.scss`,
	],
	template: `
		<div class="duels-deck-details" scrollable>
			<div class="deck-lists">
				<div class="deck-list-container starting">
					<div class="deck-selection">
						<input type="radio" name="deck" id="initial" value="initial" />
						<label for="initial">Starter deck</label>
						<input type="radio" name="deck" id="final" value="final" />
						<label for="Final">End deck</label>
					</div>
					<deck-list class="deck-list" [deckstring]="deck?.decklist"></deck-list>
				</div>
				<div class="deck-list-container final">
					<copy-deckstring
						class="copy-deckcode"
						[deckstring]="deck?.finalDecklist"
						[showTooltip]="true"
						title="Final deck"
					>
					</copy-deckstring>
					<deck-list class="deck-list" [deckstring]="deck?.finalDecklist"></deck-list>
				</div>
			</div>
			<div class="treasures">
				<div class="header">Run picks</div>
				<div class="loading" *ngIf="loading">Loading data...</div>
				<ul class="details">
					<li *ngFor="let step of steps">
						<loot-info [loot]="step"></loot-info>
					</li>
				</ul>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckDetailsComponent implements AfterViewInit {
	@Input() set state(value: DuelsState) {
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationDuels) {
		this._navigation = value;
		this.updateValues();
	}

	deck: DuelsDeckStat;
	loading: boolean;
	steps: readonly DuelsRunInfo[];

	private _state: DuelsState;
	private _navigation: NavigationDuels;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly owUtils: OwUtilsService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._state?.playerStats?.deckStats || !this._navigation) {
			return;
		}

		this.deck = this._state.playerStats.deckStats
			.map(grouped => grouped.decks)
			.reduce((a, b) => a.concat(b), [])
			.find(deck => deck.id === this._navigation.selectedDeckId);
		if (!this.deck) {
			return;
		}

		const steps: readonly (DuelsRunInfo | GameStat)[] =
			this.deck.steps ||
			(this._state.additionalDeckDetails || []).find(deck => deck.id === this._navigation.selectedDeckId)?.steps;
		console.log('steps', steps);
		this.loading = steps == null;
		if (steps) {
			this.steps = steps
				.filter(step => (step as DuelsRunInfo).bundleType)
				.map(step => step as DuelsRunInfo)
				.filter(step => step.bundleType !== 'hero-power' && step.bundleType !== 'signature-treasure');
			console.log('built steps', this.steps);
		}

		// console.log('ready to set treasures', this.deck.treasuresCardIds, this.deck);
		// this.treasures = this.deck.treasuresCardIds.map(cardId => ({
		// 	cardId: cardId,
		// 	icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`,
		// }));
	}
}
