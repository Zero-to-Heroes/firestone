import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Map } from 'immutable';
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
			<ul class="hero top-hero">
				<div class="hero-power">
					<empty-card [cardId]="topHeroPowerCard"></empty-card>
				</div>
			</ul>
			<ul class="board top-board">
				<empty-card *ngFor="let cardId of topBoardCards" [cardId]="cardId"></empty-card>
			</ul>
			<ul class="board bottom-board">
				<empty-card *ngFor="let cardId of bottomBoardCards" [cardId]="cardId"></empty-card>
			</ul>
			<ul class="hero bottom-hero">
				<div class="hero-power">
					<empty-card [cardId]="bottomHeroPowerCard"></empty-card>
				</div>
			</ul>
			<ul class="bottom-hand">
				<empty-card
					*ngFor="let cardId of bottomHandCards; let i = index"
					[style.transform]="handRotation(i)"
					[style.left.%]="handPositionLeft(i)"
					[style.top.%]="handPositionTop(i)"
					[cardId]="cardId"
				>
				</empty-card>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateMouseOverComponent {
	_gameState: GameState;

	topHeroPowerCard: string;
	topBoardCards: readonly string[];
	bottomBoardCards: readonly string[];
	bottomHeroPowerCard: string;
	bottomHandCards: readonly string[];

	private handAdjustment: Map<number, Adjustment> = this.buildHandAdjustment();

	constructor(private events: Events) {}

	@Input('gameState') set gameState(value: GameState) {
		this._gameState = value;
		if (!value) {
			return;
		}
		this.topHeroPowerCard = this._gameState.opponentDeck.heroPower && this._gameState.opponentDeck.heroPower.cardId;
		this.topBoardCards = this._gameState.opponentDeck.board.map(card => card.cardId);
		this.bottomBoardCards = this._gameState.playerDeck.board.map(card => card.cardId);
		this.bottomHeroPowerCard = this._gameState.playerDeck.heroPower && this._gameState.playerDeck.heroPower.cardId;
		this.bottomHandCards = this._gameState.playerDeck.hand.map(card => card.cardId);
		console.log('upodated', this.bottomHeroPowerCard, this.topHeroPowerCard);
	}

	handRotation(i: number) {
		const totalCards = this.bottomHandCards.length;
		if (
			!this.handAdjustment ||
			!this.handAdjustment.has(totalCards) ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).handRotation ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).handRotation.has(i)
		) {
			// console.warn('could not get handrotation', i);
			return `rotate(0deg)`;
		}
		const rotation = this.handAdjustment.get(totalCards, Adjustment.create()).handRotation.get(i, 0);
		return `rotate(${rotation}deg)`;
	}

	handPositionLeft(i: number) {
		const totalCards = this.bottomHandCards.length;
		if (
			!this.handAdjustment ||
			!this.handAdjustment.has(totalCards) ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).handPositionLeft ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).handPositionLeft.has(i)
		) {
			// console.warn('could not get handPositionLeft', i);
			return `rotate(0deg)`;
		}
		return this.handAdjustment.get(totalCards, Adjustment.create()).handPositionLeft.get(i, 0);
	}

	handPositionTop(i: number) {
		const totalCards = this.bottomHandCards.length;
		if (
			!this.handAdjustment ||
			!this.handAdjustment.has(totalCards) ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).handPositionTop ||
			!this.handAdjustment.get(totalCards, Adjustment.create()).handPositionTop.has(i)
		) {
			// console.warn('could not get handPositionTop', i);
			return `rotate(0deg)`;
		}
		return this.handAdjustment.get(totalCards, Adjustment.create()).handPositionTop.get(i, 0);
	}

	private buildHandAdjustment() {
		return Map.of(
			2,
			{
				handRotation: Map.of(),
				handPositionLeft: Map.of(0, 2),
			} as Adjustment,
			3,
			{
				// ok
				handRotation: Map.of(0, -2, 1, -1, 2, 1),
				handPositionLeft: Map.of(0, 7, 1, 8, 2, 10),
				handPositionTop: Map.of(2, -10),
			} as Adjustment,
			4,
			{
				// tested
				handRotation: Map.of(0, -25, 1, -12.5, 2, 3, 3, 15),
				handPositionLeft: Map.of(0, 5, 1, 7, 2, 8, 3, 10),
				handPositionTop: Map.of(1, -6, 2, -9),
			} as Adjustment,
			5,
			{
				// ok
				handRotation: Map.of(0, -25, 1, -17, 2, -6, 3, 10, 4, 17),
				handPositionLeft: Map.of(0, 10, 1, 9, 2, 7, 3, 5, 4, 4),
				handPositionTop: Map.of(0, 3, 1, -9, 2, -13, 3, -5, 4, 9),
			} as Adjustment,
			6,
			{
				// ok
				handRotation: Map.of(0, -25, 1, -20, 2, -8, 3, 2, 4, 10, 5, 17),
				handPositionLeft: Map.of(0, 16, 1, 14, 2, 9, 3, 6, 4, 2, 5, -1),
				handPositionTop: Map.of(0, 13, 1, -1, 2, -10, 3, -11, 4, -5, 5, 8),
			} as Adjustment,
			7,
			{
				// ok
				handRotation: Map.of(0, -25, 1, -18, 2, -8, 3, -4, 4, 7, 5, 13, 6, 19),
				handPositionLeft: Map.of(0, 23, 1, 18, 2, 12, 3, 7, 4, 2, 5, -3, 6, -8),
				handPositionTop: Map.of(0, 11, 1, -1, 2, -13, 3, -14, 4, -9, 5, 2, 6, 11),
			} as Adjustment,
			8,
			{
				// ok
				handRotation: Map.of(0, -29, 1, -20, 2, -13, 3, -5, 4, 0, 5, 7, 6, 16, 7, 20),
				handPositionLeft: Map.of(0, 29, 1, 23, 2, 17, 3, 10, 4, 4, 5, -3, 6, -9, 7, -15),
				handPositionTop: Map.of(0, 25, 1, 20, 2, -7, 3, -14, 4, -15, 5, -10, 6, -4, 7, 8),
			} as Adjustment,
			9,
			{
				// ok
				handRotation: Map.of(0, -28, 1, -20, 2, -8, 3, -10, 4, -6, 5, 3, 6, 9, 7, 16, 8, 21),
				handPositionLeft: Map.of(0, 37, 1, 29, 2, 21, 3, 15, 4, 6, 5, 0, 6, -8, 7, -15, 8, -22),
				handPositionTop: Map.of(0, 17, 1, 1, 2, -4, 3, -13, 4, -15, 5, -12, 6, -7, 7, 2, 8, 22),
			} as Adjustment,
			10,
			{
				// ok
				handRotation: Map.of(0, -25, 1, -20, 2, -17, 3, -14, 4, -5, 5, 2, 6, 6, 7, 11, 8, 15, 9, 23),
				handPositionLeft: Map.of(0, 43, 1, 35, 2, 27, 3, 19, 4, 11, 5, 3, 6, -5, 7, -13, 8, -22, 9, -30),
				handPositionTop: Map.of(0, 30, 1, 17, 2, 3, 3, -10, 4, -12, 5, -13, 6, -12, 7, -6, 8, 1, 9, 19),
			} as Adjustment,
		);
	}
}

class Adjustment {
	handRotation: Map<number, number>;
	handPositionLeft: Map<number, number>;
	handPositionTop: Map<number, number>;

	static create(): Adjustment {
		return {
			handRotation: Map.of(),
			handPositionLeft: Map.of(),
			handPositionTop: Map.of(),
		} as Adjustment;
	}
}
