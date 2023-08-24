import { Component, Input } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Map } from 'immutable';
import { DeckCard } from '../../../models/decktracker/deck-card';

@Component({
	selector: 'opponent-card-infos',
	styleUrls: ['../../../../css/component/overlays/opponenthand/opponent-card-infos.component.scss'],
	template: `
		<ul class="opponent-card-infos">
			<opponent-card-info
				*ngFor="let card of _cards; let i = index; trackBy: trackById"
				[card]="card"
				[displayTurnNumber]="displayTurnNumber"
				[displayGuess]="displayGuess"
				[displayBuff]="displayBuff"
				[leftVwOffset]="cardPositionLeft(i)"
				[topVwOffset]="cardPositionTop(i)"
				[attr.data-entity-id]="card.entityId"
			></opponent-card-info>
		</ul>
	`,
})
export class OpponentCardInfosComponent {
	@Input() displayGuess: boolean;
	@Input() displayBuff: boolean;
	@Input() displayTurnNumber: boolean;
	_cards: readonly DeckCard[];

	private handAdjustment: Map<number, Adjustment> = this.buildHandAdjustment();

	constructor(private ow: OverwolfService) {}

	@Input() set cards(value: readonly DeckCard[]) {
		this._cards = value;
	}

	cardPositionLeft(i: number) {
		const totalCards = this._cards.length;
		return 0.2 * this.handAdjustment.get(totalCards, Adjustment.create()).positionLeft.get(i, 0);
	}

	cardPositionTop(i: number) {
		const totalCards = this._cards.length;
		return 0.2 * this.handAdjustment.get(totalCards, Adjustment.create()).positionTop.get(i, 0);
	}

	trackById(index, card: DeckCard) {
		return card.entityId;
	}

	// TODO: it might be better to compute a function that matches the curve of the cards, and place
	// the numbers equidistantly on that curve
	private buildHandAdjustment(): Map<number, Adjustment> {
		return Map([
			[
				1,
				{
					positionLeft: Map.of(0, -31),
					positionTop: Map.of(0, 29),
				} as Adjustment,
			],
			[
				2,
				{
					positionLeft: Map.of(0, -58, 1, -4),
					positionTop: Map.of(0, 28, 1, 29),
				} as Adjustment,
			],
			[
				3,
				{
					positionLeft: Map.of(0, -75, 1, -25, 2, 23),
					positionTop: Map.of(0, 28, 1, 28, 2, 28),
				} as Adjustment,
			],
			[
				4,
				{
					positionLeft: Map.of(0, -95, 1, -52, 2, -7, 3, 39),
					positionTop: Map.of(0, 14, 1, 24, 2, 29, 3, 25),
				} as Adjustment,
			],
			[
				5,
				{
					positionLeft: Map.of(0, -99, 1, -65, 2, -29, 3, 6, 4, 42),
					positionTop: Map.of(0, 15, 1, 23, 2, 30, 3, 27, 4, 21),
				} as Adjustment,
			],
			[
				6,
				{
					positionLeft: Map.of(0, -103, 1, -75, 2, -45, 3, -15, 4, 17, 5, 45),
					positionTop: Map.of(0, 10, 1, 21, 2, 27, 3, 31, 4, 29, 5, 23),
				} as Adjustment,
			],
			[
				7,
				{
					positionLeft: Map.of(0, -106, 1, -81, 2, -56, 3, -29, 4, -3, 5, 22, 6, 46),
					positionTop: Map.of(0, 11, 1, 21, 2, 28, 3, 31, 4, 30, 5, 26, 6, 19),
				} as Adjustment,
			],
			[
				8,
				{
					positionLeft: Map.of(0, -104, 1, -84, 2, -62, 3, -40, 4, -17, 5, 6, 6, 28, 7, 48),
					positionTop: Map.of(0, 9, 1, 19, 2, 25, 3, 29, 4, 31, 5, 30, 6, 26, 7, 19),
				} as Adjustment,
			],
			[
				9,
				{
					positionLeft: Map.of(0, -106, 1, -87, 2, -69, 3, -49, 4, -30, 5, -10, 6, 9, 7, 29, 8, 49),
					positionTop: Map.of(0, 3, 1, 14, 2, 23, 3, 29, 4, 31, 5, 30, 6, 28, 7, 23, 8, 15),
				} as Adjustment,
			],
			[
				10,
				{
					positionLeft: Map.of(0, -108, 1, -90, 2, -74, 3, -56, 4, -39, 5, -21, 6, -3, 7, 15, 8, 33, 9, 50),
					positionTop: Map.of(0, 5, 1, 14, 2, 21, 3, 26, 4, 31, 5, 32, 6, 31, 7, 29, 8, 23, 9, 16),
				} as Adjustment,
			],
			[
				11,
				{
					positionLeft: Map.of(
						0,
						-109,
						1,
						-92,
						2,
						-76,
						3,
						-60,
						4,
						-44,
						5,
						-28,
						6,
						-13,
						7,
						3,
						8,
						20,
						9,
						35,
						10,
						50,
					),
					positionTop: Map.of(0, 7, 1, 15, 2, 22, 3, 28, 4, 32, 5, 34, 6, 34, 7, 32, 8, 28, 9, 23, 10, 19),
				} as Adjustment,
			],
			[
				12,
				{
					positionLeft: Map.of(
						0,
						-109,
						1,
						-95,
						2,
						-80,
						3,
						-66,
						4,
						-51,
						5,
						-37,
						6,
						-22,
						7,
						-7,
						8,
						9,
						9,
						23,
						10,
						38,
						11,
						53,
					),
					positionTop: Map.of(
						0,
						3,
						1,
						11,
						2,
						18,
						3,
						25,
						4,
						29,
						5,
						32,
						6,
						33,
						7,
						33,
						8,
						31,
						9,
						28,
						10,
						23,
						11,
						18,
					),
				} as Adjustment,
			],
		]);
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
