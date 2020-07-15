import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { GameState } from '../../models/decktracker/game-state';

declare let amplitude;

@Component({
	selector: 'pogo-counter',
	styleUrls: [
		'../../../css/global/components-global.scss',
		`../../../css/global/cdk-overlay.scss`,
		'../../../css/component/game-counters/counters-common.scss',
		'../../../css/component/game-counters/pogo-counter.component.scss',
		`../../../css/themes/decktracker-theme.scss`,
	],
	template: `
		<div
			class="counter pogo-counter"
			[helpTooltip]="
				(_side === 'player' ? 'You have ' : 'Your opponent has ') + 'played ' + pogoCount + ' Pogo-Hoppers'
			"
		>
			<img class="image" [src]="image" />
			<div class="frame"></div>
			<div class="value">{{ pogoCount }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PogoHopperCountersComponent {
	pogoCount: number;
	image: string;
	_side: 'player' | 'opponent';
	private _state: GameState | BattlegroundsState;

	@Input() set state(value: GameState | BattlegroundsState) {
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

		if (this.isBgsState(this._state)) {
			if ((this._state.currentGame.pogoHoppersCount || 0) === this.pogoCount) {
				return;
			}
			this.pogoCount = this._state.currentGame.pogoHoppersCount || 0;
		} else {
			const deck = this._side === 'player' ? this._state.playerDeck : this._state.opponentDeck;
			if (!deck) {
				return;
			}
			if ((deck.pogoHopperSize || 0) === this.pogoCount) {
				return;
			}
			this.pogoCount = deck.pogoHopperSize || 0;
		}

		const card = CardIds.Collectible.Rogue.PogoHopper;
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${card}.jpg`;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private isBgsState(state: GameState | BattlegroundsState): state is BattlegroundsState {
		if ((state as BattlegroundsState).currentGame) {
			return true;
		}
		return false;
	}
}
