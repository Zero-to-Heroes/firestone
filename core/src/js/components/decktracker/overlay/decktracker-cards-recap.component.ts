import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DeckState } from '../../../models/decktracker/deck-state';

@Component({
	selector: 'decktracker-cards-recap',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-cards-recap.component.scss',
	],
	template: `
		<div class="cards-recap">
			<div
				class="recap cards-in-hand"
				[helpTooltip]="'decktracker.cards-in-hand-tooltip' | owTranslate"
				[bindTooltipToGameWindow]="true"
			>
				<div class="icon">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#cards_in_hand" />
					</svg>
				</div>
				<div class="count">{{ cardsInHand }}</div>
			</div>
			<div
				class="recap cards-in-deck"
				[helpTooltip]="'decktracker.cards-left-in-deck-tooltip' | owTranslate"
				[bindTooltipToGameWindow]="true"
			>
				<div class="icon">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#cards_in_deck" />
					</svg>
				</div>
				<div class="count">{{ showCardsInDeck ? cardsInDeck : '-' }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerCardsRecapComponent {
	cardsInHand: number;
	cardsInDeck: number;

	@Input() showCardsInDeck = true;

	@Input() set deck(value: DeckState) {
		this.cardsInHand = value && value.hand ? value.hand.length : 0;
		if (value && value.cardsLeftInDeck != null) {
			this.cardsInDeck = value.cardsLeftInDeck;
		} else if (value && value.isOpponent && value.hero && value.deckList.length > 0 && value.deck.length > 0) {
			// Our best guess if we don't have the direct info but have a decklist
			this.cardsInDeck = value.deck.length - value.hand.length;
		} else {
			this.cardsInDeck = value && value.deck ? value.deck.length : 0;
		}
	}
}
