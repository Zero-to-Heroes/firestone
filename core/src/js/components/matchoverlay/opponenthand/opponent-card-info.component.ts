import { Component, Input } from '@angular/core';
import { DeckCard } from '../../../models/decktracker/deck-card';

@Component({
	selector: 'opponent-card-info',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/matchoverlay/opponenthand/opponent-card-info.component.scss',
	],
	template: `
		<div class="opponent-card-info" [style.left.vh]="leftVhOffset" [style.top.vh]="topVhOffset">
			<opponent-card-turn-number *ngIf="displayTurnNumber" [card]="_card"></opponent-card-turn-number>
			<opponent-card-info-id
				*ngIf="displayGuess || displayBuff"
				[displayGuess]="displayGuess"
				[displayBuff]="displayBuff"
				[maxBuffsToShow]="maxBuffsToShow"
				[card]="_card"
			></opponent-card-info-id>
		</div>
	`,
})
export class OpponentCardInfoComponent {
	@Input() displayGuess: boolean;
	@Input() displayBuff: boolean;
	@Input() maxBuffsToShow: number;
	@Input() displayTurnNumber: boolean;
	// Weuse vh instead of vw here, because the height of the playing area is not affected when
	// you resize the window. The width on the other hand changes, because the border outside of
	// the play area are cropped
	@Input() leftVhOffset: number;
	@Input() topVhOffset: number;
	_card: DeckCard;

	@Input() set card(value: DeckCard) {
		this._card = value;
	}
}
