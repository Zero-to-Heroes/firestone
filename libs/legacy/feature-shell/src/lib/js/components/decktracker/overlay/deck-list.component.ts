import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DeckCard, DeckHandlerService, DeckState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { VisualDeckCard } from '@models/decktracker/visual-deck-card';
import { SetCard } from '../../../models/set';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'deck-list',
	styleUrls: [
		`../../../../css/global/scrollbar-decktracker-overlay.scss`,
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
		'../../../../css/component/decktracker/overlay/decktracker-deck-list.component.scss',
		'../../../../css/component/decktracker/overlay/deck-list.component.scss',
	],
	template: `
		<decktracker-deck-list
			class="deck-list"
			[deckState]="deckState"
			displayMode="DISPLAY_MODE_GROUPED"
			[colorManaCost]="true"
			[collection]="collection"
			[side]="side"
			(cardClicked)="onCardClicked($event)"
		></decktracker-deck-list>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckListComponent {
	@Output() cardClicked: EventEmitter<VisualDeckCard> = new EventEmitter<VisualDeckCard>();

	@Input() side: 'player' | 'opponent' | 'duels' = 'player';

	@Input() set deckstring(value: string) {
		const decklist = this.deckHandler.buildDeckList(value);
		this.deckState = DeckState.create({
			deckList: decklist,
			deck: decklist,
			deckstring: value,
		} as DeckState);
	}

	@Input() set cards(value: readonly string[]) {
		const decklist: readonly DeckCard[] = (value ?? [])
			.map((cardId) => this.allCards.getCard(cardId))
			.filter((card) => card)
			.map((card) => {
				return DeckCard.create({
					cardId: card.id,
					cardName: this.i18n.getCardName(card.id),
					refManaCost: card.cost,
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

	onCardClicked(card: VisualDeckCard) {
		this.cardClicked.next(card);
	}
}
