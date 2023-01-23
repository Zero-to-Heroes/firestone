import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckHandlerService } from '../../../services/decktracker/deck-handler.service';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { groupByFunction } from '../../../services/utils';
import { CardsByCost } from './cards-by-cost';

@Component({
	selector: 'deck-mana-curve',
	styleUrls: [`../../../../css/component/decktracker/main/deck-mana-curve.component.scss`],
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
	@Input() set deckstring(value: string) {
		if (!value) {
			return;
		}

		const cards = this.deckHandler.buildDeckList(value);
		const groupedByCost = groupByFunction((card: DeckCard) => '' + Math.min(7, card.manaCost))(cards);
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
	maxQuantity = 0;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly deckHandler: DeckHandlerService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
}
