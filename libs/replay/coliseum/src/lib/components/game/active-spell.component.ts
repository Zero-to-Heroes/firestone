import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'active-spell',
	styleUrls: ['./active-spell.component.scss'],
	template: `
		<div class="active-spell">
			<card
				class="active-spell"
				*ngIf="_entity"
				[hasTooltip]="false"
				[controller]="_controller"
				[entity]="_entity"
			>
			</card>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActiveSpellComponent {
	_entity: Entity | undefined;
	_controller: Entity | undefined;

	@Input() set entity(value: Entity | undefined) {
		// console.debug('[active-spell] setting new entity', value);
		this._entity = value;
	}

	@Input() set controller(value: Entity | undefined) {
		// console.debug('[active-spell] setting controller', value);
		this._controller = value;
	}
}
