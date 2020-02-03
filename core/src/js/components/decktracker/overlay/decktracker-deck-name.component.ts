import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DeckState } from '../../../models/decktracker/deck-state';

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
	deckName: string;

	@Input() set deck(value: DeckState) {
		this.deckName = value.name || (value.hero ? value.hero.playerName || value.hero.name : 'Unnamed deck');
	}
}
