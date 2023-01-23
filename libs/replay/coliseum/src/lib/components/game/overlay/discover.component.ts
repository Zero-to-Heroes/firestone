import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';

@Component({
	selector: 'discover',
	styleUrls: ['./discover.component.scss'],
	template: `
		<div class="discover">
			<li *ngFor="let entity of discoverCards; let i = index; trackBy: trackByFn">
				<card
					[entity]="entity"
					[hasTooltip]="false"
					[ngClass]="{ chosen: _chosen?.indexOf(entity.id) !== -1 }"
				></card>
			</li>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscoverComponent {
	_entities: Map<number, Entity>;
	_choices: readonly number[];
	_chosen: readonly number[];

	discoverCards: readonly Entity[];

	@Input() set entities(entities: Map<number, Entity>) {
		console.debug('[discover] setting new entities', entities && entities.toJS());
		this._entities = entities;
		this.updateEntityGroups();
	}

	@Input() set choices(value: readonly number[]) {
		console.debug('[discover] setting choices', value);
		this._choices = value;
		this.updateEntityGroups();
	}

	@Input() set chosen(value: readonly number[]) {
		console.debug('[discover] setting chosen', value);
		this._chosen = value;
	}

	trackByFn(index, item: Entity) {
		return item.id;
	}

	private updateEntityGroups() {
		if (!this._entities || !this._choices) {
			console.debug('[discover] entities not initialized yet');
			return;
		}
		this.discoverCards = this._entities
			.valueSeq()
			.toArray()
			.filter((entity) => this._choices.indexOf(entity.id) !== -1);
	}
}
