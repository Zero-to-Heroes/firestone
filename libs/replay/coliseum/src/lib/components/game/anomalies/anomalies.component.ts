import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardType, GameTag, Zone } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';
import { Map } from 'immutable';

@Component({
	selector: 'anomalies',
	styleUrls: ['./anomalies.component.scss'],
	template: `
		<div class="anomalies">
			<anomaly-entity *ngFor="let entity of anomalies; let i = index; trackBy: trackByFn" [entity]="entity">
			</anomaly-entity>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnomaliesComponent {
	anomalies: readonly Entity[];

	@Input() set entities(value: Map<number, Entity>) {
		this.anomalies = value
			.valueSeq()
			.toArray()
			.filter(
				(entity) =>
					entity.getTag(GameTag.CARDTYPE) === CardType.BATTLEGROUND_ANOMALY && entity.getZone() === Zone.PLAY,
			);
	}

	trackByFn(index, item: Entity) {
		return item.id;
	}
}
