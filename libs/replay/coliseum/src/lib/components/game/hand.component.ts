import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'hand',
	styleUrls: ['./hand.component.scss'],
	template: `
		<ul class="hand" [transition-group]="'flip-list'">
			<li
				transition-group-item
				*ngFor="let entity of _entities; let i = index; trackBy: trackByFn"
				[style.marginLeft.%]="i !== 0 ? marginLeft : 0"
			>
				<card [entity]="entity" [showCard]="_showCards" [option]="isOption(entity)" [controller]="_controller">
				</card>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandComponent {
	_entities: readonly Entity[];
	_options: readonly number[];
	_controller: Entity;
	marginLeft: number;
	_showCards = true;

	@Input() set entities(entities: readonly Entity[]) {
		// console.debug('[hand] setting new entities', entities);
		this._entities = entities;
		if (!entities) {
			return;
		}
		switch (entities.length) {
			case 7:
				this.marginLeft = -2;
				return;
			case 8:
				this.marginLeft = -2.3;
				return;
			case 9:
				this.marginLeft = -2.5;
				return;
			case 10:
				this.marginLeft = -2.7;
				return;
			default:
				this.marginLeft = -1;
		}
	}

	@Input() set showCards(value: boolean) {
		// console.debug('[mulligan] setting showCards', value);
		this._showCards = value;
	}

	@Input() set options(value: readonly number[]) {
		// console.debug('[hand] setting options', value);
		this._options = value;
	}

	@Input() set controller(value: Entity) {
		// console.debug('[hand] setting controller', value);
		this._controller = value;
	}

	isOption(entity: Entity): boolean {
		return this._options.indexOf(entity.id) !== -1;
	}

	trackByFn(index, item: Entity) {
		return item.id;
	}
}
