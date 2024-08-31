import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsFaceOffWithSimulation } from '@firestone/battlegrounds/core';

@Component({
	selector: 'bgs-battle',
	styleUrls: [`./bgs-battle.component.scss`],
	template: `
		<div class="bgs-battle">
			<div class="turn-label" *ngIf="turnNumber">
				<div
					class="turn"
					[owTranslate]="'battlegrounds.battle.turn'"
					[translateParams]="{ value: turnNumber }"
				></div>
			</div>
			<bgs-simulator class="simulator" [faceOff]="_faceOff"></bgs-simulator>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsBattleComponent {
	@Input() set faceOff(value: BgsFaceOffWithSimulation) {
		// Make sure we have an instance of the class, and not just a data structure
		this._faceOff = BgsFaceOffWithSimulation.create(value);
	}

	turnNumber: number;
	_faceOff: BgsFaceOffWithSimulation;
}
