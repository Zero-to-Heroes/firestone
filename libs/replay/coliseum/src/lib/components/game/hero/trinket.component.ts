import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'trinket',
	styleUrls: ['./trinket.component.scss'],
	template: `
		<div *ngIf="entity" class="trinket" cardTooltip [tooltipEntity]="entity" [attr.data-entity-id]="entityId">
			<div class="box-side">
				<hero-power-art [cardId]="cardId"></hero-power-art>
				<hero-power-frame [exhausted]="false"></hero-power-frame>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrinketComponent {
	entity: Entity | undefined;
	entityId: number;
	cardId: string;
	cost: number;

	@Input() set trinket(value: Entity | undefined) {
		// console.debug('[hero-power] setting new heroPower', heroPower, heroPower && heroPower.tags.toJS());
		this.entity = value;
		if (!value) {
			// console.debug('no hero power, returning');
			return;
		}
		this.entityId = value.id;
		this.cardId = value.cardID;
	}
}
