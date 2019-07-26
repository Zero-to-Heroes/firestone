import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameState } from '../../../../models/decktracker/game-state';
import { Events } from '../../../../services/events.service';

@Component({
	selector: 'state-mouse-over',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/decktracker/overlay/twitch/state-mouse-over.component.scss',
	],
	template: `
		<div class="state-mouse-over">
			<ul class="board top-board">
				<empty-card *ngFor="let cardId of topBoardCards;" [cardId]="cardId"></empty-card>
			</ul>
			<ul class="board bottom-board">
				<empty-card *ngFor="let cardId of bottomBoardCards;" [cardId]="cardId"></empty-card>
			</ul>
			<ul class="bottom-hand">
				<empty-card *ngFor="let cardId of bottomHandCards;" [cardId]="cardId"></empty-card>
			</ul>
        </div>
    `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateMouseOverComponent {

	_gameState: GameState;

	topBoardCards: ReadonlyArray<string>;
	bottomBoardCards: ReadonlyArray<string>;
	bottomHandCards: ReadonlyArray<string>;

	constructor(
			private logger: NGXLogger,
            private events: Events) {
	}

	@Input('gameState') set gameState(value: GameState) {
		this._gameState = value;
		if (!value) {
			return;
		}
		this.topBoardCards = this._gameState.opponentDeck.board.map(card => card.cardId);
		this.logger.debug('top board cards', this.topBoardCards, this._gameState.opponentDeck);
		this.bottomBoardCards = this._gameState.playerDeck.board.map(card => card.cardId);
		this.bottomHandCards = this._gameState.playerDeck.hand.map(card => card.cardId);
	}
}