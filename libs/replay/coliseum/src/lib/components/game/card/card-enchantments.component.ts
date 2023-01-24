import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'card-enchantments',
	styleUrls: ['../../../text.scss', './card-enchantments.component.scss'],
	template: `
		<div class="card-enchantments">
			<card-enchantment *ngFor="let enchantment of _enchantments; trackBy: trackByFn" [enchantment]="enchantment">
			</card-enchantment>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEnchantmentsComponent {
	_enchantments: readonly Entity[];

	@Input() set enchantments(value: readonly Entity[]) {
		// console.debug('[card-enchantments] setting enchantments', value);
		this._enchantments = value;
	}

	trackByFn(index, item: Entity) {
		return item.id;
	}
}
