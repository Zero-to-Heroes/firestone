import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HeroCard } from '../../../models/decktracker/hero-card';

@Component({
	selector: 'decktracker-deck-name',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/decktracker-deck-name.component.scss',
	],
	template: `
		<div class="deck-name">
			<span class="name">{{ deckName }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckTrackerDeckNameComponent {
	// deckImage: string;

	@Input() deckName: string;

	@Input('hero') set hero(hero: HeroCard) {
		// if (hero) {
		// 	this.deckImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${hero.cardId}.jpg)`;
		// }
	}
}
