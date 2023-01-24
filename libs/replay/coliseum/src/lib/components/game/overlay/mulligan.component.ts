import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag, Zone } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';

@Component({
	selector: 'mulligan',
	styleUrls: ['./mulligan.component.scss'],
	template: `
		<div class="mulligan">
			<li *ngFor="let entity of mulliganCards; let i = index; trackBy: trackByFn">
				<card
					[entity]="entity"
					[showCard]="_showCards"
					[hasTooltip]="false"
					[crossed]="_crossed?.indexOf(entity.id) !== -1"
				>
				</card>
			</li>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MulliganComponent {
	_entities: Map<number, Entity>;
	_playerId: number;
	_crossed: readonly number[] | undefined;
	_showCards = true;

	mulliganCards: readonly Entity[];

	@Input() set entities(entities: Map<number, Entity>) {
		// console.debug('[mulligan] setting new entities', entities && entities.toJS());
		this._entities = entities;
		this.updateEntityGroups();
	}

	@Input() set crossed(value: readonly number[] | undefined) {
		this._crossed = value;
	}

	@Input() set playerId(playerId: number) {
		// console.debug('[mulligan] setting playerId', playerId);
		this._playerId = playerId;
		this.updateEntityGroups();
	}

	@Input() set showCards(value: boolean) {
		// console.debug('[mulligan] setting showCards', value);
		this._showCards = value;
	}

	trackByFn(index, item: Entity) {
		return item.id;
	}

	private updateEntityGroups() {
		if (!this._entities || !this._playerId) {
			// console.debug('[mulligan] entities not initialized yet');
			return;
		}

		this.mulliganCards = this.getMulliganEntities(this._playerId);
	}

	private getMulliganEntities(playerId: number): readonly Entity[] {
		return this._entities
			.valueSeq()
			.toArray()
			.filter((entity) => entity.getTag(GameTag.CONTROLLER) === playerId)
			.filter((entity) => entity.getTag(GameTag.ZONE) === Zone.HAND)
			.filter((entity) => entity.cardID !== 'GAME_005') // Don't show the coin yet
			.sort((a, b) => a.getTag(GameTag.ZONE_POSITION) - b.getTag(GameTag.ZONE_POSITION));
	}
}
