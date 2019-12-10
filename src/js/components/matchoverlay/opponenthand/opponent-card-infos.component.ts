import { Component, Input } from '@angular/core';
import { Map } from 'immutable';
import { NGXLogger } from 'ngx-logger';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'opponent-card-infos',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/matchoverlay/opponenthand/opponent-card-infos.component.scss',
	],
	template: `
		<ul class="opponent-card-infos">
			<opponent-card-info
				*ngFor="let card of _cards; let i = index; trackBy: trackById"
				[card]="card"
				[displayTurnNumber]="displayTurnNumber"
				[displayGuess]="displayGuess"
				[leftVhOffset]="cardPositionLeft(i)"
				[topVhOffset]="cardPositionTop(i)"
			></opponent-card-info>
		</ul>
	`,
})
export class OpponentCardInfosComponent {
	@Input() displayGuess: boolean;
	@Input() displayTurnNumber: boolean;
	_cards: readonly DeckCard[];

	private handAdjustment: Map<number, Adjustment> = this.buildHandAdjustment();

	constructor(private logger: NGXLogger, private ow: OverwolfService) {}

	@Input() set cards(value: readonly DeckCard[]) {
		this._cards = value;
	}

	cardPositionLeft(i: number) {
		const totalCards = this._cards.length;
		return this.handAdjustment.get(totalCards, Adjustment.create()).positionLeft.get(i, 0);
	}

	cardPositionTop(i: number) {
		const totalCards = this._cards.length;
		return this.handAdjustment.get(totalCards, Adjustment.create()).positionTop.get(i, 0);
	}

	trackById(index, card: DeckCard) {
		return card.entityId;
	}

	private buildHandAdjustment() {
		return Map.of(
			1,
			{
				positionLeft: Map.of(0, -31),
				positionTop: Map.of(0, 29),
			} as Adjustment,
			2,
			{
				positionLeft: Map.of(0, -58, 1, -4),
				positionTop: Map.of(0, 28, 1, 29),
			} as Adjustment,
			3,
			{
				positionLeft: Map.of(0, -85, 1, -28, 2, 30),
				positionTop: Map.of(0, 20, 1, 28, 2, 23),
			} as Adjustment,
			4,
			{
				positionLeft: Map.of(0, -93, 1, -50, 2, -8, 3, 36),
				positionTop: Map.of(0, 12, 1, 24, 2, 29, 3, 26),
			} as Adjustment,
			5,
			{
				positionLeft: Map.of(0, -96, 1, -63, 2, -29, 3, 6, 4, 40),
				positionTop: Map.of(0, 13, 1, 22, 2, 30, 3, 27, 4, 21),
			} as Adjustment,
			6,
			{
				positionLeft: Map.of(0, -102, 1, -74, 2, -44, 3, -15, 4, 14, 5, 42),
				positionTop: Map.of(0, 5, 1, 18, 2, 26, 3, 31, 4, 29, 5, 23),
			} as Adjustment,
			7,
			{
				positionLeft: Map.of(0, -104, 1, -79, 2, -54, 3, -29, 4, -3, 5, 21, 6, 45),
				positionTop: Map.of(0, 8, 1, 18, 2, 26, 3, 31, 4, 30, 5, 23, 6, 16),
			} as Adjustment,
			8,
			{
				positionLeft: Map.of(0, -103, 1, -83, 2, -62, 3, -40, 4, -17, 5, 4, 6, 24, 7, 48),
				positionTop: Map.of(0, 2, 1, 13, 2, 23, 3, 29, 4, 31, 5, 30, 6, 26, 7, 19),
			} as Adjustment,
			9,
			{
				positionLeft: Map.of(0, -106, 1, -87, 2, -69, 3, -49, 4, -30, 5, -10, 6, 9, 7, 29, 8, 49),
				positionTop: Map.of(0, 3, 1, 14, 2, 23, 3, 29, 4, 31, 5, 30, 6, 26, 7, 23, 8, 15),
			} as Adjustment,
			10,
			{
				positionLeft: Map.of(0, -108, 1, -90, 2, -74, 3, -56, 4, -39, 5, -21, 6, -3, 7, 15, 8, 33, 9, 50),
				positionTop: Map.of(0, 0, 1, 9, 2, 18, 3, 25, 4, 31, 5, 32, 6, 31, 7, 29, 8, 23, 9, 16),
			} as Adjustment,
			11,
			{
				positionLeft: Map.of(0, -108, 1, -90, 2, -74, 3, -56, 4, -39, 5, -21, 6, -3, 7, 15, 8, 33, 9, 50),
				positionTop: Map.of(0, 0, 1, 9, 2, 18, 3, 25, 4, 31, 5, 32, 6, 31, 7, 29, 8, 23, 9, 16),
			} as Adjustment,
			12,
			{
				positionLeft: Map.of(
					0,
					-108,
					1,
					-90,
					2,
					-74,
					3,
					-56,
					4,
					-39,
					5,
					-21,
					6,
					-3,
					7,
					15,
					8,
					33,
					9,
					50,
					10,
					60,
					11,
					70,
				),
				positionTop: Map.of(0, 0, 1, 9, 2, 18, 3, 25, 4, 31, 5, 32, 6, 31, 7, 29, 8, 23, 9, 16, 10, 16, 11, 16),
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
