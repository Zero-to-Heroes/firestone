import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { GameState } from '../../../../models/decktracker/game-state';
import { Events } from '../../../../services/events.service';
import { Map } from 'immutable';

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
				<empty-card *ngFor="let cardId of bottomHandCards; let i = index;" 
						[style.transform]="handRotation(i)"
						[style.left.%]="handPositionLeft(i)"
						[cardId]="cardId">
				</empty-card>
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

	private handAdjustment: Map<number, Adjustment> = this.buildHandAdjustment();

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

	handRotation(i: number) {
		const totalCards = this.bottomHandCards.length;
		const rotation = this.handAdjustment.get(totalCards, Adjustment.create()).handRotation.get(i, 0);
		return `rotate(${rotation}deg)`;
	}

	handPositionLeft(i: number) {
		const totalCards = this.bottomHandCards.length;
		return this.handAdjustment.get(totalCards, Adjustment.create()).handPositionLeft.get(i, 0);
	}

	private buildHandAdjustment() {
		return Map.of(
			2, {
				handRotation: Map.of(),
				handPositionLeft: Map.of(
					0, 2
				)
			} as Adjustment,
			3, {
				handRotation: Map.of(
					0, -2,
					1, -1,
					2, 1,
				),
				handPositionLeft: Map.of(
					0, 7,
					1, 8,
					2, 11,
				)
			} as Adjustment,
			4, {
				handRotation: Map.of(
					0, -25,
					1, -12.5,
					2, 3,
					3, 15,
				),
				handPositionLeft: Map.of(
					0, 9,
					1, 7,
					2, 6,
					3, 6
				)
			} as Adjustment,
			5, {
				handRotation: Map.of(
					0, -25,
					1, -12.5,
					2, -6,
					3, 10,
					4, 13,
				),
				handPositionLeft: Map.of(
					0, 10,
					1, 9,
					2, 7,
					3, 6,
					4, 6
				)
			} as Adjustment,
			6, {
				handRotation: Map.of(
					0, -25,
					1, -20,
					2, -8,
					3, 2,
					4, 10,
					5, 13,
				),
				handPositionLeft: Map.of(
					0, 12,
					1, 13,
					2, 9,
					3, 6,
					4, 2,
					5, -1
				)
			} as Adjustment,
			7, {
				handRotation: Map.of(
					0, -25,
					1, -20,
					2, -8,
					3, 2,
					4, 10,
					5, 13,
					6, 16,
				),
				handPositionLeft: Map.of(
					0, 12,
					1, 13,
					2, 9,
					3, 6,
					4, 2,
					5, -1,
					6, -4,
				)
			} as Adjustment,
			8, {
				handRotation: Map.of(
					0, -25,
					1, -20,
					2, -8,
					3, 2,
					4, 10,
					5, 13,
					6, 16,
					7, 19,
				),
				handPositionLeft: Map.of(
					0, 12,
					1, 13,
					2, 9,
					3, 6,
					4, 2,
					5, -1,
					6, -4,
					7, -7,
				)
			} as Adjustment,
			9, {
				handRotation: Map.of(
					0, -25,
					1, -20,
					2, -8,
					3, 2,
					4, 10,
					5, 13,
					6, 16,
					7, 19,
					8, 21,
				),
				handPositionLeft: Map.of(
					0, 12,
					1, 13,
					2, 9,
					3, 6,
					4, 2,
					5, -1,
					6, -4,
					7, -7,
					8, -10,
				)
			} as Adjustment,
			10, {
				handRotation: Map.of(
					0, -25,
					1, -20,
					2, -20,
					3, -14,
					4, -5,
					5, 2,
					6, 4,
					7, 8,
					8, 15,
					9, 17
				),
				handPositionLeft: Map.of(
					0, 45,
					1, 37,
					2, 31,
					3, 21,
					4, 12,
					5, 2,
					6, -7,
					7, -17,
					8, -27,
					9, -35
				)
			} as Adjustment,
		);
	}
}

class Adjustment {
	handRotation: Map<number, number>;
	handPositionLeft: Map<number, number>;

	static create(): Adjustment {
		return {
			handRotation: Map.of(),
			handPositionLeft: Map.of(),
		} as Adjustment;
	}
}