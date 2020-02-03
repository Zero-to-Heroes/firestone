import { Component, Input, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { DeckCard } from '../../../models/decktracker/deck-card';

@Component({
	selector: 'opponent-card-turn-number',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/matchoverlay/opponenthand/opponent-card-turn-number.component.scss',
	],
	template: `
		<div class="opponent-card-turn-number">
			<span class="turn-number">{{ _turn }}</span>
		</div>
	`,
})
export class OpponentCardTurnNumberComponent implements OnInit {
	_turn: number | 'M';

	constructor(private logger: NGXLogger) {}

	ngOnInit(): void {}

	@Input() set card(value: DeckCard) {
		const turn = value.metaInfo ? value.metaInfo.turnAtWhichCardEnteredCurrentZone : undefined;
		this._turn = turn === 'mulligan' ? 'M' : turn;
	}
}
