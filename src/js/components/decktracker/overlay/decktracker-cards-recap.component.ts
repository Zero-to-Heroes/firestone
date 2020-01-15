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
			<div class="recap cards-in-hand">
				<div class="icon" helpTooltip="Cards in hand">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#cards_in_hand" />
					</svg>
				</div>
				<div class="count">{{ cardsInHand }}</div>
			</div>
			<div class="recap cards-in-deck">
				<div class="icon" helpTooltip="Cards left in deck">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#cards_in_deck" />
					</svg>
				</div>
				<div class="count">{{ cardsInDeck }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerCardsRecapComponent {
	cardsInHand: number;
	cardsInDeck: number;

	@Input() set deck(value: DeckState) {
		this.cardsInHand = value && value.hand ? value.hand.length : 0;
		this.cardsInDeck = value && value.deck ? value.deck.length : 0;
	}

	constructor() {
		console.log('building recap');
	}

	ngAfterViewInit() {
		console.log('build recap');
	}
}
