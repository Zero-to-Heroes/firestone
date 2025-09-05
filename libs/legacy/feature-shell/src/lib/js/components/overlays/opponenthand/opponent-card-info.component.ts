import { Component, Input } from '@angular/core';
import { DeckCard, DeckState, GameState, Metadata } from '@firestone/game-state';

@Component({
	standalone: false,
	selector: 'opponent-card-info',
	styleUrls: ['../../../../css/component/overlays/opponenthand/opponent-card-info.component.scss'],
	template: `
		<div class="opponent-card-info scalable" [style.left.vh]="leftVwOffset" [style.top.vh]="topVwOffset">
			<opponent-card-turn-number *ngIf="displayTurnNumber" [card]="card"></opponent-card-turn-number>
			<opponent-card-info-id
				*ngIf="displayGuess || displayBuff"
				[displayGuess]="displayGuess"
				[displayBuff]="displayBuff"
				[card]="card"
				[context]="context"
			></opponent-card-info-id>
		</div>
	`,
})
export class OpponentCardInfoComponent {
	@Input() displayGuess: boolean;
	@Input() displayBuff: boolean;
	@Input() displayTurnNumber: boolean;
	// Weuse vh instead of vw here, because the height of the playing area is not affected when
	// you resize the window. The width on the other hand changes, because the border outside of
	// the play area are cropped
	@Input() leftVwOffset: number;
	@Input() topVwOffset: number;
	@Input() context: { deck: DeckState; gameState: GameState; metadata: Metadata; currentTurn: number | 'mulligan' };
	@Input() card: DeckCard;
}
