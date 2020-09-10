import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameState } from '../../models/decktracker/game-state';

declare let amplitude;

@Component({
	selector: 'attack-counter',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/game-counters/attack-counter.component.scss',
		`../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div
			class="counter attack-counter"
			[helpTooltip]="
				(_side === 'player' ? 'You have ' : 'Your opponent has ') +
				totalAttackOnBoard +
				' total attack from board and hero'
			"
		>
			<div class="frame">{{ totalAttackOnBoard }}</div>
			<div class="value" [inlineSVG]="'assets/svg/attack.svg'"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttackCountersComponent {
	totalAttackOnBoard: number;
	_side: 'player' | 'opponent';

	private _state: GameState;

	@Input() set state(value: GameState) {
		this._state = value;
		this.updateInfo();
	}

	@Input() set side(value: 'player' | 'opponent') {
		this._side = value;
		this.updateInfo();
	}

	constructor(private readonly cdr: ChangeDetectorRef) {
		this.cdr.detach();
	}

	private updateInfo() {
		if (!this._state || !this._side) {
			return;
		}

		const deck = this._side === 'player' ? this._state.playerDeck : this._state.opponentDeck;
		if (!deck) {
			return;
		}

		this.totalAttackOnBoard = (deck.totalAttackOnBoard?.board || 0) + (deck.totalAttackOnBoard?.hero || 0);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
