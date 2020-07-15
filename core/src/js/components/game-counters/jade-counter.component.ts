import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../models/decktracker/game-state';

declare let amplitude;

@Component({
	selector: 'jade-counter',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/game-counters/counters-common.scss',
		'../../../css/component/game-counters/jade-counter.component.scss',
		`../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div
			class="counter jade-counter"
			[helpTooltip]="(_side === 'player' ? 'Your ' : 'Your opponent ') + 'Jade Golem size is ' + golemSize"
		>
			<img class="image" [src]="image" />
			<div class="frame"></div>
			<div class="value">{{ golemSize }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JadeCounterComponent {
	golemSize: number;
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
		if ((deck.jadeGolemSize || 0) === this.golemSize) {
			return;
		}
		this.golemSize = deck.jadeGolemSize || 0;
		const cardId = CardIds.NonCollectible.Neutral['JadeGolem' + Math.max(this.golemSize, 1)];
		console.log('card', cardId);
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
