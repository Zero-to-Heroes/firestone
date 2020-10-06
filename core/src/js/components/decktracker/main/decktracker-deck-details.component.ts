import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';
import { DeckHandlerService } from '../../../services/decktracker/deck-handler.service';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { groupByFunction } from '../../../services/utils';

@Component({
	selector: 'decktracker-deck-details',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-deck-details.component.scss`,
	],
	template: `
		<div class="decktracker-deck-details">
			<ul class="deck-list" scrollable>
				<li *ngFor="let card of cards">
					<deck-card [card]="card" [colorManaCost]="true"></deck-card>
				</li>
			</ul>
			<deck-winrate-matrix [deck]="deck"> </deck-winrate-matrix>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckDetailsComponent implements AfterViewInit {
	@Input() set state(value: MainWindowState) {
		this._state = value;
		this.updateValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.updateValues();
	}

	cards: readonly VisualDeckCard[];
	deck: DeckSummary;

	private _state: MainWindowState;
	private _navigation: NavigationState;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly deckHandler: DeckHandlerService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateValues() {
		if (!this._state?.decktracker?.decks || !this._navigation?.navigationDecktracker) {
			return;
		}

		this.deck = this._state.decktracker.decks.find(
			deck => deck.deckstring === this._navigation.navigationDecktracker.selectedDeckstring,
		);
		if (!this.deck) {
			return;
		}

		const decklist = this.deckHandler.buildDeckList(this.deck.deckstring);
		console.log('built decklist', decklist);

		const cards = decklist.map(
			deckCard =>
				VisualDeckCard.create({
					cardId: deckCard.cardId,
					cardName: deckCard.cardName,
					manaCost: deckCard.manaCost,
					rarity: deckCard.rarity,
				} as VisualDeckCard) as VisualDeckCard,
		);
		const grouped: { [cardId: string]: VisualDeckCard[] } = groupByFunction((card: VisualDeckCard) => card.cardId)(
			cards,
		);
		console.log('grouped', grouped, cards);

		this.cards = Object.keys(grouped)
			.map(cardId =>
				Object.assign(new VisualDeckCard(), grouped[cardId][0], {
					totalQuantity: grouped[cardId].length,
				} as VisualDeckCard),
			)
			.sort((a, b) => this.compare(a, b));
	}

	private compare(a: VisualDeckCard, b: VisualDeckCard): number {
		if (a.manaCost < b.manaCost) {
			return -1;
		}
		if (a.manaCost > b.manaCost) {
			return 1;
		}
		if (a.cardName < b.cardName) {
			return -1;
		}
		if (a.cardName > b.cardName) {
			return 1;
		}
		if (a.creatorCardIds.length === 0) {
			return -1;
		}
		if (b.creatorCardIds.length === 0) {
			return 1;
		}
		return 0;
	}
}
