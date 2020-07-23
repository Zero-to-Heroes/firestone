import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameState } from '../../models/decktracker/game-state';

declare let amplitude;

@Component({
	selector: 'cthun-counter',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/game-counters/counters-common.scss',
		// '../../../css/component/game-counters/cthun-counter.component.scss',
		`../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div
			class="counter cthun-counter"
			[helpTooltip]="
				(_side === 'player' ? 'Your ' : 'Your opponent ') + 'CThun is a ' + cthunSize + '/' + cthunSize
			"
		>
			<img class="image" [src]="image" />
			<div class="frame"></div>
			<div class="value">{{ cthunSize }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CthunCounterComponent {
	cthunSize: number;
	image: string;
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
		if ((deck.cthunSize || 0) === this.cthunSize) {
			return;
		}
		this.cthunSize = deck.cthunSize || 6;
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/OG_280.jpg`;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
