import { Component, Input, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { DeckCard } from '../../../models/decktracker/deck-card';

@Component({
	selector: 'opponent-card-info',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/matchoverlay/opponenthand/opponent-card-info.component.scss',
	],
	template: `
		<div class="opponent-card-info">
			<opponent-card-turn-number *ngIf="displayTurnNumber" [card]="_card"></opponent-card-turn-number>
			<opponent-card-info-id *ngIf="displayGuess" [card]="_card"></opponent-card-info-id>
		</div>
	`,
})
export class OpponentCardInfoComponent implements OnInit {
	@Input() displayGuess: boolean;
	@Input() displayTurnNumber: boolean;
	_card: DeckCard;

	constructor(private logger: NGXLogger) {}

	ngOnInit(): void {}

	@Input() set card(value: DeckCard) {
		this._card = value;
	}
}
