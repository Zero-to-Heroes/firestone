import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AllCardsService, Entity } from '@firestone/replay/replay-parser';
import { GroupedEnchantment, groupAndSortEnchantments } from './enchantment-text.utils';

@Component({
	standalone: false,
	selector: 'card-enchantments',
	styleUrls: ['../../../text.scss', './card-enchantments.component.scss'],
	template: `
		<div class="card-enchantments">
			<card-enchantment
				*ngFor="let enchantment of _enchantments; trackBy: trackByFn"
				[enchantment]="enchantment.entity"
				[count]="enchantment.count"
			>
			</card-enchantment>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEnchantmentsComponent {
	_enchantments: readonly GroupedEnchantment[];

	constructor(private readonly cards: AllCardsService) {}

	@Input() set enchantments(value: readonly Entity[]) {
		// console.debug('[card-enchantments] setting enchantments', value);
		this._enchantments = groupAndSortEnchantments(value, (cardId) => this.isVisibleEnchantment(cardId));
	}

	trackByFn(index, item: GroupedEnchantment) {
		return item.entity.cardID ?? item.entity.id;
	}

	private isVisibleEnchantment(cardId: string): boolean {
		if (!cardId) {
			return false;
		}
		const card = this.cards.getCard(cardId, false);
		return !card?.mechanics?.includes('ENCHANTMENT_INVISIBLE');
	}
}
