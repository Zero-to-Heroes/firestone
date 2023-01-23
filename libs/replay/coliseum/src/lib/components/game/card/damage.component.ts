import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'damage',
	styleUrls: ['../../../text.scss', './damage.component.scss'],
	template: `
		<div class="damage" cardElementResize [fontSizeRatio]="0.3">
			<img class="damage-icon" src="{{ image }}" />
			<div class="amount" resizeTarget>
				<div>{{ prefix }}{{ _amount }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DamageComponent {
	image: string;
	prefix: string;
	_amount: number;

	@Input() set amount(value: number) {
		console.debug('[damage] setting amount', value);
		this._amount = Math.abs(value);
		if (value >= 0) {
			this.prefix = '-';
			this.image = 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/icon_damage.png';
		} else {
			this.prefix = '+';
			this.image = 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/icon_heal.png';
		}
	}
}
