import { Component, Input, OnInit } from '@angular/core';
import { Map } from 'immutable';
import { NGXLogger } from 'ngx-logger';
import { DeckCard } from '../../../models/decktracker/deck-card';

@Component({
	selector: 'opponent-card-infos',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/matchoverlay/opponenthand/opponent-card-infos.component.scss',
	],
	template: `
		<ul class="opponent-card-infos">
			<opponent-card-info
				*ngFor="let turnNumber of cardTurnNumbers; let i = index"
				[turn]="turnNumber"
				[style.left.%]="cardPositionLeft(i)"
				[style.top.%]="cardPositionTop(i)"
			></opponent-card-info>
		</ul>
	`,
})
export class OpponentCardInfosComponent implements OnInit {
	cardTurnNumbers: readonly (number | 'M')[];

	private handAdjustment: Map<number, Adjustment> = this.buildHandAdjustment();

	constructor(private logger: NGXLogger) {}

	ngOnInit(): void {}

	@Input() set cards(value: readonly DeckCard[]) {
		this.logger.debug('[opponent-card-infos] setting card turn numbers', value);
		this.cardTurnNumbers = value
			.map(card => card.metaInfo.turnAtWhichCardEnteredCurrentZone)
			.map(turn => (turn === 'mulligan' ? 'M' : turn));
	}

	cardPositionLeft(i: number) {
		const totalCards = this.cardTurnNumbers.length;
		return this.handAdjustment.get(totalCards, Adjustment.create()).positionLeft.get(i, 0);
	}

	cardPositionTop(i: number) {
		const totalCards = this.cardTurnNumbers.length;
		return this.handAdjustment.get(totalCards, Adjustment.create()).positionTop.get(i, 0);
	}

	private buildHandAdjustment() {
		return Map.of(
			1, // ok
			{
				positionLeft: Map.of(0, 43),
				positionTop: Map.of(0, 29),
			} as Adjustment,
			2,
			{
				positionLeft: Map.of(0, 35, 1, 51),
				positionTop: Map.of(0, 28, 1, 29),
			} as Adjustment,
			3, // ok
			{
				positionLeft: Map.of(0, 27, 1, 43, 2, 59),
				positionTop: Map.of(0, 20, 1, 28, 2, 24),
			} as Adjustment,
			4, // ok
			{
				positionLeft: Map.of(0, 24, 1, 36, 2, 48, 3, 62),
				positionTop: Map.of(0, 12, 1, 24, 2, 31, 3, 28),
			} as Adjustment,
			5, // ok
			{
				positionLeft: Map.of(0, 23, 1, 33, 2, 43, 3, 53, 4, 63),
				positionTop: Map.of(0, 13, 1, 24, 2, 30, 3, 28, 4, 21),
			} as Adjustment,
			6, // ok
			{
				positionLeft: Map.of(0, 22, 1, 30, 2, 38, 3, 47, 4, 55, 5, 64),
				positionTop: Map.of(0, 5, 1, 16, 2, 26, 3, 31, 4, 29, 5, 23),
			} as Adjustment,
			7,
			{
				positionLeft: Map.of(0, 23, 1, 18, 2, 12, 3, 7, 4, 2, 5, -3, 6, -8),
				positionTop: Map.of(0, 11, 1, -1, 2, -13, 3, -14, 4, -9, 5, 2, 6, 11),
			} as Adjustment,
			8,
			{
				positionLeft: Map.of(0, 29, 1, 23, 2, 17, 3, 10, 4, 4, 5, -3, 6, -9, 7, -15),
				positionTop: Map.of(0, 25, 1, 20, 2, -7, 3, -14, 4, -15, 5, -10, 6, -4, 7, 8),
			} as Adjustment,
			9,
			{
				positionLeft: Map.of(0, 37, 1, 29, 2, 21, 3, 15, 4, 6, 5, 0, 6, -8, 7, -15, 8, -22),
				positionTop: Map.of(0, 17, 1, 1, 2, -4, 3, -13, 4, -15, 5, -12, 6, -7, 7, 2, 8, 22),
			} as Adjustment,
			10,
			{
				positionLeft: Map.of(0, 43, 1, 35, 2, 27, 3, 19, 4, 11, 5, 3, 6, -5, 7, -13, 8, -22, 9, -30),
				positionTop: Map.of(0, 30, 1, 17, 2, 3, 3, -10, 4, -12, 5, -13, 6, -12, 7, -6, 8, 1, 9, 19),
			} as Adjustment,
		);
	}
}

class Adjustment {
	positionLeft: Map<number, number>;
	positionTop: Map<number, number>;

	static create(): Adjustment {
		return {
			positionLeft: Map.of(),
			positionTop: Map.of(),
		} as Adjustment;
	}
}
