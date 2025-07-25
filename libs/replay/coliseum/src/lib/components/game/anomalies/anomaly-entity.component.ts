import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	standalone: false,
	selector: 'anomaly-entity',
	styleUrls: ['./anomaly-entity.component.scss'],
	template: `
		<div class="anomaly-entity" cardTooltip [tooltipEntity]="_entity">
			<img class="portrait" [src]="image" />
			<img
				class="frame"
				src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/hero/hero_power.png"
			/>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnomalyEntityComponent {
	image: string;

	_entity: Entity;

	@Input() set entity(value: Entity) {
		this.image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardID}.jpg`;
		this._entity = value;
	}
}
