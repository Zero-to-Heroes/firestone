import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { DeckHandlerService } from '../../../services/decktracker/deck-handler.service';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { groupByFunction } from '../../../services/utils';
import { CardsByCost } from './cards-by-cost';

@Component({
	selector: 'deck-mana-curve',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/deck-mana-curve.component.scss`,
	],
	template: `
		<div class="deck-mana-curve">
			<deck-mana-curve-bar
				*ngFor="let cardByCost of cardsByCost"
				[info]="cardByCost"
				[maxQuantity]="maxQuantity"
			></deck-mana-curve-bar>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckManaCurveComponent implements AfterViewInit {
	@Input() set deck(value: DeckSummary) {
		if (!value) {
			return;
		}

		const cards = this.deckHandler.buildDeckList(value.deckstring);
		const groupedByCost = groupByFunction((card: DeckCard) => '' + card.manaCost)(cards);
		const cardsByCost: CardsByCost[] = [];
		for (let i = 0; i < 8; i++) {
			const cardsForCost: readonly DeckCard[] = groupedByCost['' + i] || [];
			cardsByCost.push({
				cost: i,
				label: i === 7 ? '7+' : i,
				quantity: cardsForCost.length,
			} as CardsByCost);
			this.maxQuantity = Math.max(this.maxQuantity, cardsForCost.length);
		}
		this.cardsByCost = cardsByCost;
	}

	cardsByCost: readonly CardsByCost[];
	maxQuantity: number = 0;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly deckHandler: DeckHandlerService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
}
