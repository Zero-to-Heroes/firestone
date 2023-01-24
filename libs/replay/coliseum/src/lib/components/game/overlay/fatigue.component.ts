import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'fatigue',
	styleUrls: ['./fatigue.component.scss'],
	template: `
		<div class="fatigue" cardElementResize [fontSizeRatio]="0.05">
			<img src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/fatigue.png" />
			<div class="text" resizeTarget>
				<span>Out of cards! Take {{ _fatigue }} damage.</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FatigueComponent {
	_fatigue: number;

	@Input() set fatigue(value: number) {
		// console.debug('[fatigue] setting fatigue', value);
		this._fatigue = value;
	}
}
