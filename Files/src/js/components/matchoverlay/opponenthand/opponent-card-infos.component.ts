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
			2, // ok
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
			7, // ok
			{
				positionLeft: Map.of(0, 21, 1, 28, 2, 35, 3, 42, 4, 49, 5, 57, 6, 64),
				positionTop: Map.of(0, 6, 1, 18, 2, 26, 3, 31, 4, 29, 5, 23, 6, 16),
			} as Adjustment,
			8, // ok
			{
				positionLeft: Map.of(0, 21, 1, 27, 2, 33, 3, 39, 4, 45, 5, 52, 6, 58, 7, 64),
				positionTop: Map.of(0, 3, 1, 14, 2, 23, 3, 29, 4, 31, 5, 29, 6, 26, 7, 19),
			} as Adjustment,
			9, // ok
			{
				positionLeft: Map.of(0, 20, 1, 26, 2, 31, 3, 36, 4, 42, 5, 48, 6, 54, 7, 59, 8, 64),
				positionTop: Map.of(0, 3, 1, 14, 2, 23, 3, 29, 4, 31, 5, 30, 6, 26, 7, 23, 8, 15),
			} as Adjustment,
			10, // ok
			{
				positionLeft: Map.of(0, 21, 1, 25, 2, 30, 3, 35, 4, 40, 5, 45, 6, 50, 7, 55, 8, 60, 9, 65),
				positionTop: Map.of(0, 0, 1, 9, 2, 18, 3, 25, 4, 31, 5, 32, 6, 31, 7, 29, 8, 23, 9, 16),
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
