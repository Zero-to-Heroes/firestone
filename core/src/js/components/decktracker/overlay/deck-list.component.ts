import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { SetCard } from '../../../models/set';
import { DeckHandlerService } from '../../../services/decktracker/deck-handler.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'deck-list',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-deck-list.component.scss',
		'../../../../css/component/decktracker/overlay/deck-list.component.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
		`../../../../css/global/scrollbar-decktracker-overlay.scss`,
	],
	template: `
		<decktracker-deck-list
			class="deck-list"
			[deckState]="deckState"
			displayMode="DISPLAY_MODE_GROUPED"
			[colorManaCost]="true"
			[collection]="collection"
			tooltipPosition="right"
		></decktracker-deck-list>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckListComponent {
	@Input() set deckstring(value: string) {
		const decklist = this.deckHandler.buildDeckList(value);
		this.deckState = DeckState.create({
			deckList: decklist,
			deck: decklist,
		} as DeckState);
	}

	@Input() set cards(value: readonly string[]) {
		const decklist: readonly DeckCard[] = value
			.map((cardId) => this.allCards.getCard(cardId))
			.filter((card) => card)
			.map((card) => {
				return DeckCard.create({
					cardId: card.id,
					cardName: this.i18n.getCardName(card.id),
					manaCost: card.cost,
					rarity: card.rarity ? card.rarity.toLowerCase() : null,
				} as DeckCard);
			});
		this.deckState = DeckState.create({
			deckList: decklist,
			deck: decklist,
		} as DeckState);
	}

	@Input() collection: readonly SetCard[];

	deckState: DeckState;

	constructor(
		private readonly deckHandler: DeckHandlerService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}
}
