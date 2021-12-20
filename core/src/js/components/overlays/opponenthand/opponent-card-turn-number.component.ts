import { Component, Input } from '@angular/core';
import { DeckCard } from '../../../models/decktracker/deck-card';

@Component({
	selector: 'opponent-card-turn-number',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/overlays/opponenthand/opponent-card-turn-number.component.scss',
	],
	template: `
		<div class="opponent-card-turn-number">
			<span class="turn-number">{{ _turn }}</span>
		</div>
	`,
})
export class OpponentCardTurnNumberComponent {
	_turn: number | 'M';

	@Input() set card(value: DeckCard) {
		const turn = value.metaInfo ? value.metaInfo.turnAtWhichCardEnteredCurrentZone : undefined;
		this._turn = turn === 'mulligan' ? 'M' : turn;
	}
}
