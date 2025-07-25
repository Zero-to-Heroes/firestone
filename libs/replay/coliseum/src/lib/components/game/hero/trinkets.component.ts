import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	standalone: false,
	selector: 'trinkets',
	styleUrls: ['./trinkets.component.scss'],
	template: `
		<div class="trinkets">
			<trinket class="trinket lesser" *ngIf="lesserTrinket" [trinket]="lesserTrinket"></trinket>
			<trinket class="trinket greater" *ngIf="greaterTrinket" [trinket]="greaterTrinket"></trinket>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrinketsComponent {
	lesserTrinket: Entity | undefined;
	greaterTrinket: Entity | undefined;

	@Input() set trinkets(value: readonly Entity[]) {
		this.lesserTrinket = value.find((entity) => entity.getTag(GameTag.TAG_SCRIPT_DATA_NUM_6) === 1);
		this.greaterTrinket = value.find((entity) => entity.getTag(GameTag.TAG_SCRIPT_DATA_NUM_6) === 2);
	}
}
