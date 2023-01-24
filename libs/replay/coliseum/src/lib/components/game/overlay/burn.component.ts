import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';

@Component({
	selector: 'burn',
	styleUrls: ['./burn.component.scss'],
	template: `
		<div class="burn">
			<li *ngFor="let entity of burnedCards; let i = index; trackBy: trackByFn">
				<card [entity]="entity" [hasTooltip]="false" [burned]="true"></card>
			</li>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BurnComponent {
	_entities: Map<number, Entity>;
	_burned: readonly number[];

	burnedCards: readonly Entity[];

	@Input() set entities(entities: Map<number, Entity>) {
		// console.debug('[burn] setting new entities', entities && entities.toJS());
		this._entities = entities;
		this.updateEntityGroups();
	}

	@Input() set burned(value: readonly number[]) {
		// console.debug('[burn] setting burned', value);
		this._burned = value;
		this.updateEntityGroups();
	}

	trackByFn(index, item: Entity) {
		return item.id;
	}

	private updateEntityGroups() {
		if (!this._entities || !this._burned) {
			// console.debug('[burn] entities not initialized yet');
			return;
		}
		this.burnedCards = this._entities
			.valueSeq()
			.toArray()
			.filter((entity) => this._burned.indexOf(entity.id) !== -1);
	}
}
